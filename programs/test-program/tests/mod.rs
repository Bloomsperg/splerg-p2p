use borsh::BorshDeserialize;
use mints::mint_to_ata;
use solana_sdk::{
    instruction::AccountMeta, program_pack::Pack, signature::Keypair, signer::Signer,
    transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;
use splerg_p2p::state::SwapOrder;
use test_program::{mints, utils, PROGRAM_KEY};
use utils::TestSetup;

#[test]
fn test_initialize_order() {
    let mut setup = TestSetup::new();

    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;

    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    setup.verify_order(maker_amount, taker_amount);
}

#[test]
fn test_change_order() {
    let mut setup = TestSetup::new();

    // Initialize order
    let initial_maker_amount = 50_000u64;
    let initial_taker_amount = 100_000u64;
    let tx = setup.initialize_order(initial_maker_amount, initial_taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    // Change order amounts
    let new_maker_amount = 100_000u64;
    let new_taker_amount = 200_000u64;
    let mut change_amount_data = vec![1]; // variant 1 for ChangeOrderAmounts
    change_amount_data.extend_from_slice(&new_maker_amount.to_le_bytes());
    change_amount_data.extend_from_slice(&new_taker_amount.to_le_bytes());

    let change_amounts_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
            AccountMeta::new(setup.order_maker_token_ata, false),
            AccountMeta::new(setup.maker_token_ata, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: change_amount_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[change_amounts_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();
    setup.verify_order(new_maker_amount, new_taker_amount);
}

#[test]
fn test_change_taker() {
    let mut setup = TestSetup::new();

    // Initialize order
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    // Test ChangeTaker
    let new_taker = Keypair::new();
    let mut change_taker_data = vec![2]; // variant 2 for ChangeTaker
    change_taker_data.extend_from_slice(&new_taker.pubkey().to_bytes());

    let change_taker_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
            AccountMeta::new_readonly(new_taker.pubkey(), false),
        ],
        data: change_taker_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[change_taker_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();

    // Verify taker changed
    let order_account = setup.svm.get_account(&setup.order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();
    assert_eq!(order_data.taker, new_taker.pubkey());
}

#[test]
fn test_complete_swap() {
    let mut setup = TestSetup::new();

    // Create and setup taker
    let taker = Keypair::new();
    setup.svm.airdrop(&taker.pubkey(), 100_000_000_000).unwrap();

    // Get ATAs for swap
    let maker_taker_token_ata =
        get_associated_token_address(&setup.payer.pubkey(), &setup.taker_mint.pubkey());
    let taker_maker_token_ata =
        get_associated_token_address(&taker.pubkey(), &setup.maker_mint.pubkey());
    let taker_taker_token_ata =
        get_associated_token_address(&taker.pubkey(), &setup.taker_mint.pubkey());

    // Create necessary ATAs
    let create_atas_ix = vec![
        spl_associated_token_account::instruction::create_associated_token_account(
            &setup.payer.pubkey(),
            &setup.payer.pubkey(),
            &setup.taker_mint.pubkey(),
            &spl_token::id(),
        ),
        spl_associated_token_account::instruction::create_associated_token_account(
            &setup.payer.pubkey(),
            &taker.pubkey(),
            &setup.maker_mint.pubkey(),
            &spl_token::id(),
        ),
    ];

    let tx = Transaction::new_signed_with_payer(
        &create_atas_ix,
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );
    setup.svm.send_transaction(tx).unwrap();

    // Mint tokens to taker
    setup.svm = mint_to_ata(
        setup.svm,
        &setup.payer,
        &setup.taker_mint,
        1_000_000,
        &taker.pubkey(),
    )
    .unwrap();

    // Initialize order
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    // Complete swap
    let complete_swap_data = vec![3]; // variant 3 for CompleteSwap
    let complete_swap_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(taker.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
            AccountMeta::new(maker_taker_token_ata, false),
            AccountMeta::new(taker_taker_token_ata, false),
            AccountMeta::new(taker_maker_token_ata, false),
            AccountMeta::new(setup.order_maker_token_ata, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: complete_swap_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[complete_swap_ix],
        Some(&taker.pubkey()),
        &[&taker],
        setup.svm.latest_blockhash(),
    );
    setup.svm.send_transaction(tx).unwrap();

    // Verify balances
    let maker_taker_account = setup.svm.get_account(&maker_taker_token_ata).unwrap();
    let taker_maker_account = setup.svm.get_account(&taker_maker_token_ata).unwrap();
    let maker_balance = spl_token::state::Account::unpack(&maker_taker_account.data).unwrap();
    let taker_balance = spl_token::state::Account::unpack(&taker_maker_account.data).unwrap();

    assert_eq!(maker_balance.amount, taker_amount);
    assert_eq!(taker_balance.amount, maker_amount);

    // Verify escrow is empty
    let escrow_account = setup.svm.get_account(&setup.order_maker_token_ata).unwrap();
    let escrow_balance = spl_token::state::Account::unpack(&escrow_account.data).unwrap();
    assert_eq!(escrow_balance.amount, 0);
}

#[test]
fn test_close_order() {
    let mut setup = TestSetup::new();

    // Initialize order
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    // Record initial balance
    let initial_maker_balance = spl_token::state::Account::unpack(
        &setup.svm.get_account(&setup.maker_token_ata).unwrap().data,
    )
    .unwrap()
    .amount;

    // Close order
    let close_order_data = vec![4]; // variant 4 for CloseOrder
    let close_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
            AccountMeta::new(setup.order_maker_token_ata, false),
            AccountMeta::new(setup.maker_token_ata, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: close_order_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[close_order_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );
    setup.svm.send_transaction(tx).unwrap();

    // Verify order account is closed
    let closed_order = setup.svm.get_account(&setup.order_pda).unwrap();
    assert_eq!(closed_order.lamports, 0);
    assert_eq!(closed_order.data.len(), SwapOrder::LEN);
    assert!(closed_order.data.iter().all(|&x| x == 0));

    // Verify tokens were returned
    let final_maker_balance = spl_token::state::Account::unpack(
        &setup.svm.get_account(&setup.maker_token_ata).unwrap().data,
    )
    .unwrap()
    .amount;
    assert_eq!(final_maker_balance, initial_maker_balance + maker_amount);
}
