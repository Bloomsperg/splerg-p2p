use borsh::BorshDeserialize;
use mints::mint_to_ata;
use solana_sdk::{
    instruction::AccountMeta, program_pack::Pack, pubkey::Pubkey, signature::Keypair,
    signer::Signer, transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;
use splerg_p2p::state::{SwapOrder, Treasury};
use test_program::{mints, utils, PROGRAM_KEY};
use utils::TestSetup;

#[test]
fn test_initialize_treasury() {
    let mut setup = TestSetup::new();

    // Generate new authority
    let authority = Keypair::new();
    let fee = 100u16;

    // Create initialize treasury instruction
    let mut init_treasury_data = vec![0]; // variant 0 for InitializeTreasury
    init_treasury_data.extend_from_slice(&authority.pubkey().to_bytes());
    init_treasury_data.extend_from_slice(&fee.to_le_bytes());

    let (treasury_pda, _) = Pubkey::find_program_address(&[b"treasury"], &PROGRAM_KEY);

    let init_treasury_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new_readonly(authority.pubkey(), false),
            AccountMeta::new_readonly(solana_program::system_program::id(), false),
            AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
        ],
        data: init_treasury_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[init_treasury_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();

    // Verify treasury account was created properly
    let treasury_account = setup.svm.get_account(&treasury_pda).unwrap();
    let treasury_data = Treasury::try_from_slice(&treasury_account.data).unwrap();
    assert_eq!(treasury_data.authority, authority.pubkey());
    assert_eq!(treasury_data.fee, fee);
}

#[test]
fn test_update_treasury_authority() {
    let mut setup = TestSetup::new();

    // First initialize treasury
    let initial_authority = Keypair::new();
    let initial_fee = 100u64;

    let mut init_treasury_data = vec![0];
    init_treasury_data.extend_from_slice(&initial_authority.pubkey().to_bytes());
    init_treasury_data.extend_from_slice(&initial_fee.to_le_bytes());

    let (treasury_pda, _) = Pubkey::find_program_address(&[b"treasury"], &PROGRAM_KEY);

    let init_treasury_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new_readonly(initial_authority.pubkey(), false),
            AccountMeta::new_readonly(solana_program::system_program::id(), false),
            AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
        ],
        data: init_treasury_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[init_treasury_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();

    // Now update the authority
    let new_authority = Keypair::new();
    let new_fee = 200u16;

    let mut update_treasury_data = vec![1]; // variant 1 for UpdateTreasuryAuthority
    update_treasury_data.extend_from_slice(&new_authority.pubkey().to_bytes());
    update_treasury_data.extend_from_slice(&new_fee.to_le_bytes());

    let update_treasury_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new_readonly(initial_authority.pubkey(), true),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new_readonly(new_authority.pubkey(), false),
        ],
        data: update_treasury_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[update_treasury_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer, &initial_authority],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();

    // Verify treasury was updated
    let treasury_account = setup.svm.get_account(&treasury_pda).unwrap();
    let treasury_data = Treasury::try_from_slice(&treasury_account.data).unwrap();
    assert_eq!(treasury_data.authority, new_authority.pubkey());
    assert_eq!(treasury_data.fee, new_fee);
}

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
    let mut change_amount_data = vec![4]; // variant 4 for ChangeOrderAmounts
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
    let mut change_taker_data = vec![5]; // variant 5 for ChangeTaker
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
    let complete_swap_data = vec![6]; // variant 6 for CompleteSwap
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
    let close_order_data = vec![7]; // variant 7 for CloseOrder
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
