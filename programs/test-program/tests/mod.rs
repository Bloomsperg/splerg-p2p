use borsh::BorshDeserialize;
use mints::mint_to_ata;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    program_pack::Pack,
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    transaction::Transaction,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::state::Account;
use splerg_p2p::{
    math::fee::calculate_token_fee,
    state::{SwapOrder, Treasury},
};
use test_program::{mints, utils, PROGRAM_KEY};
use utils::TestSetup;

#[test]
fn test_initialize_treasury() {
    let mut setup = TestSetup::new();

    let authority = Keypair::new();
    let fee = 100u16;

    let mut init_treasury_data = vec![0]; // variant 0 for InitializeTreasury
    init_treasury_data.extend_from_slice(&authority.pubkey().to_bytes());
    init_treasury_data.extend_from_slice(&fee.to_le_bytes());

    let tx = setup.initialize_treasury(&authority.pubkey(), 100);

    setup.svm.send_transaction(tx).unwrap();

    let (treasury_pda, _) = Pubkey::find_program_address(&[b"treasury"], &PROGRAM_KEY);

    let treasury_account = setup.svm.get_account(&treasury_pda).unwrap();
    let treasury_data = Treasury::try_from_slice(&treasury_account.data).unwrap();
    assert_eq!(treasury_data.authority, authority.pubkey());
    assert_eq!(treasury_data.fee, fee);
}

#[test]
fn test_update_treasury_authority() {
    let mut setup = TestSetup::new();

    let initial_authority = Keypair::new();
    let initial_fee = 100u16;

    let mut init_treasury_data = vec![0]; // variant 0 for InitializeTreasury
    init_treasury_data.extend_from_slice(&initial_authority.pubkey().to_bytes());
    init_treasury_data.extend_from_slice(&initial_fee.to_le_bytes());

    let (treasury_pda, _) = Pubkey::find_program_address(&[b"treasury"], &PROGRAM_KEY);

    let tx = setup.initialize_treasury(&initial_authority.pubkey(), initial_fee);

    setup.svm.send_transaction(tx).unwrap();

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

    let order_account = setup.svm.get_account(&setup.order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();

    assert_eq!(order_data.maker, setup.payer.pubkey());
    assert_eq!(order_data.maker_amount, maker_amount);
    assert_eq!(order_data.taker_amount, taker_amount);
}

#[test]
fn test_change_order() {
    let mut setup = TestSetup::new();

    let initial_maker_amount = 50_000u64;
    let initial_taker_amount = 100_000u64;
    let tx = setup.initialize_order(initial_maker_amount, initial_taker_amount);
    setup.svm.send_transaction(tx).unwrap();

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
            AccountMeta::new(setup.maker_mint.pubkey(), false),
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

    let order_account = setup.svm.get_account(&setup.order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();

    assert_eq!(order_data.maker, setup.payer.pubkey());
    assert_eq!(order_data.maker_amount, new_maker_amount);
    assert_eq!(order_data.taker_amount, new_taker_amount);
}

#[test]
fn test_change_taker() {
    let mut setup = TestSetup::new();

    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

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

    let order_account = setup.svm.get_account(&setup.order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();
    assert_eq!(order_data.taker, new_taker.pubkey());
}

#[test]
fn test_swap_harvest() {
    let mut setup = TestSetup::new();

    let taker: Keypair = Keypair::new();
    setup.svm.airdrop(&taker.pubkey(), 100_000_000_000).unwrap();

    let (treasury_pda, _) = Pubkey::find_program_address(&[b"treasury"], &PROGRAM_KEY);

    let mut init_treasury_data = vec![0]; // variant 0 for InitializeTreasury
    let fee = 100u16;

    init_treasury_data.extend_from_slice(&setup.payer.pubkey().to_bytes());
    init_treasury_data.extend_from_slice(&fee.to_le_bytes());

    let init_treasury_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new_readonly(setup.payer.pubkey(), false),
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

    let maker_taker_token_ata =
        get_associated_token_address(&setup.payer.pubkey(), &setup.taker_mint.pubkey());
    let authority_maker_ata =
        get_associated_token_address(&setup.payer.pubkey(), &setup.maker_mint.pubkey());

    let taker_maker_token_ata =
        get_associated_token_address(&taker.pubkey(), &setup.maker_mint.pubkey());
    let taker_taker_token_ata =
        get_associated_token_address(&taker.pubkey(), &setup.taker_mint.pubkey());
    let treasury_maker_ata =
        get_associated_token_address(&treasury_pda, &setup.maker_mint.pubkey());
    let treasury_taker_ata =
        get_associated_token_address(&treasury_pda, &setup.taker_mint.pubkey());

    let create_atas_ix = vec![
        create_associated_token_account(
            &setup.payer.pubkey(),
            &setup.payer.pubkey(),
            &setup.taker_mint.pubkey(),
            &spl_token::id(),
        ),
        create_associated_token_account(
            &setup.payer.pubkey(),
            &taker.pubkey(),
            &setup.maker_mint.pubkey(),
            &spl_token::id(),
        ),
        create_associated_token_account(
            &setup.payer.pubkey(),
            &treasury_pda,
            &setup.maker_mint.pubkey(),
            &spl_token::id(),
        ),
        create_associated_token_account(
            &setup.payer.pubkey(),
            &treasury_pda,
            &setup.taker_mint.pubkey(),
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

    setup.svm = mint_to_ata(
        setup.svm,
        &setup.payer,
        &setup.taker_mint,
        1_000_000,
        &taker.pubkey(),
    )
    .unwrap();

    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    let complete_swap_ix = Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(taker.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
            AccountMeta::new(maker_taker_token_ata, false),
            AccountMeta::new(taker_taker_token_ata, false),
            AccountMeta::new(taker_maker_token_ata, false),
            AccountMeta::new(setup.order_maker_token_ata, false),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new(treasury_maker_ata, false),
            AccountMeta::new(treasury_taker_ata, false),
            AccountMeta::new(setup.maker_mint.pubkey(), false),
            AccountMeta::new(setup.taker_mint.pubkey(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(spl_token_2022::id(), false),
        ],
        data: vec![6],
    };

    let tx = Transaction::new_signed_with_payer(
        &[complete_swap_ix],
        Some(&taker.pubkey()),
        &[&taker],
        setup.svm.latest_blockhash(),
    );
    setup.svm.send_transaction(tx).unwrap();

    let treasury_maker_account = setup.svm.get_account(&treasury_maker_ata).unwrap();
    let treasury_taker_account = setup.svm.get_account(&treasury_taker_ata).unwrap();
    let treasury_maker_balance = Account::unpack(&treasury_maker_account.data).unwrap();
    let treasury_taker_balance = Account::unpack(&treasury_taker_account.data).unwrap();

    let treasury_account = setup.svm.get_account(&treasury_pda).unwrap();
    let treasury_data = Treasury::try_from_slice(&treasury_account.data).unwrap();

    let expected_maker_fee =
        calculate_token_fee(maker_amount.into(), treasury_data.fee).unwrap() as u64;
    let expected_taker_fee =
        calculate_token_fee(taker_amount.into(), treasury_data.fee).unwrap() as u64;

    assert_eq!(treasury_maker_balance.amount, expected_maker_fee);
    assert_eq!(treasury_taker_balance.amount, expected_taker_fee);

    let maker_taker_account = setup.svm.get_account(&maker_taker_token_ata).unwrap();
    let taker_maker_account = setup.svm.get_account(&taker_maker_token_ata).unwrap();
    let maker_balance = spl_token::state::Account::unpack(&maker_taker_account.data).unwrap();
    let taker_balance = spl_token::state::Account::unpack(&taker_maker_account.data).unwrap();

    assert_eq!(maker_balance.amount, taker_amount - expected_taker_fee);
    assert_eq!(taker_balance.amount, maker_amount - expected_maker_fee);

    // Verify escrow is empty
    let escrow_account = setup.svm.get_account(&setup.order_maker_token_ata).unwrap();
    let escrow_balance = spl_token::state::Account::unpack(&escrow_account.data).unwrap();
    assert_eq!(escrow_balance.amount, 0);

    let authority_account = setup.svm.get_account(&authority_maker_ata).unwrap();
    let authority_balance_before =
        spl_token::state::Account::unpack(&authority_account.data).unwrap();

    let harvest_ix = Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(treasury_pda, false),
            AccountMeta::new(treasury_maker_ata, false),
            AccountMeta::new(authority_maker_ata, false),
            AccountMeta::new(setup.maker_mint.pubkey(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: vec![2], // variant 2 for Harvest
    };

    let tx = Transaction::new_signed_with_payer(
        &[harvest_ix],
        Some(&setup.payer.pubkey()),
        &[&setup.payer],
        setup.svm.latest_blockhash(),
    );

    setup.svm.send_transaction(tx).unwrap();

    let authority_account = setup.svm.get_account(&authority_maker_ata).unwrap();
    let authority_balance = spl_token::state::Account::unpack(&authority_account.data).unwrap();
    assert_eq!(
        authority_balance.amount - authority_balance_before.amount,
        expected_maker_fee
    );

    let treasury_account = setup.svm.get_account(&treasury_maker_ata).unwrap();
    let treasury_balance = spl_token::state::Account::unpack(&treasury_account.data).unwrap();
    assert_eq!(treasury_balance.amount, 0);
}

#[test]
fn test_close_order() {
    let mut setup = TestSetup::new();

    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let tx = setup.initialize_order(maker_amount, taker_amount);
    setup.svm.send_transaction(tx).unwrap();

    let close_order_data = vec![7]; // variant 7 for CloseOrder
    let close_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(setup.payer.pubkey(), true),
            AccountMeta::new(setup.order_pda, false),
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
}
