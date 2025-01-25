use borsh::BorshDeserialize;
use litesvm::LiteSVM;
use mints::{mint_to_ata, setup_mint};
use solana_program::{pubkey::Pubkey, system_program};
use solana_sdk::{
    instruction::AccountMeta, program_pack::Pack, rent::sysvar, signature::Keypair, signer::Signer,
    transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;
use splerg_p2p::state::SwapOrder;
use utils::load_program;

mod mints;
mod utils;

const PROGRAM_KEY: Pubkey = Pubkey::from_str_const("GKTd9AGFpPGNKK28ncHeGGuT7rBJLzPxNjCUPKn8Yik8");

#[test]
fn test_splerg_p2p() {
    let mut svm = LiteSVM::new();

    // Load our swap program
    svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
        .unwrap();

    // Setup payer account
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    // Setup two different mints
    let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
    let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
    let mut svm = taker_mint_setup.svm;

    // Mint some tokens to the maker (payer in this case)
    svm = mint_to_ata(
        svm,
        &payer,
        &maker_mint_setup.mint,
        1_000_000,
        &payer.pubkey(),
    )
    .unwrap();

    // Create a taker keypair
    let taker = Keypair::new();

    // Find the PDA for the order account
    let (order_pda, _bump) = Pubkey::find_program_address(
        &[
            b"order",
            payer.pubkey().as_ref(),
            maker_mint_setup.mint.pubkey().as_ref(),
            taker_mint_setup.mint.pubkey().as_ref(),
        ],
        &PROGRAM_KEY,
    );

    // Get maker's ATA for their mint
    let maker_token_ata =
        get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());

    // Get order PDA's ATA for maker's mint
    let order_maker_token_ata =
        get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

    let create_order_ata_ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &order_pda,
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        );

    // Create and send transaction to create ATAs
    let create_atas_tx = Transaction::new_signed_with_payer(
        &[create_order_ata_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_atas_tx).unwrap();

    // Create instruction data
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let mut ix_data = vec![0]; // variant 0 for InitializeOrder
    ix_data.extend_from_slice(&maker_amount.to_le_bytes());
    ix_data.extend_from_slice(&taker_amount.to_le_bytes());

    // Create the transaction
    let initialize_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),           // maker
            AccountMeta::new(order_pda, false),               // order account
            AccountMeta::new(maker_token_ata, false),         // maker's token account
            AccountMeta::new(order_maker_token_ata, false),   // order's token account
            AccountMeta::new_readonly(taker.pubkey(), false), // taker
            AccountMeta::new_readonly(maker_mint_setup.mint.pubkey(), false), // maker token mint
            AccountMeta::new_readonly(taker_mint_setup.mint.pubkey(), false), // taker token mint
            AccountMeta::new_readonly(system_program::id(), false), // system program
            AccountMeta::new_readonly(sysvar::id(), false),   // rent sysvar
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: ix_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[initialize_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    // Send and confirm transaction
    svm.send_transaction(tx).unwrap();

    // Verify the order was created correctly
    let order_account = svm.get_account(&order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();

    assert_eq!(order_data.maker, payer.pubkey());
    assert_eq!(order_data.taker, taker.pubkey());
    assert_eq!(order_data.maker_amount, maker_amount);
    assert_eq!(order_data.taker_amount, taker_amount);

    // Verify tokens were transferred to the order account
    let order_token_account = svm.get_account(&order_maker_token_ata).unwrap();
    let token_data = spl_token::state::Account::unpack(&order_token_account.data).unwrap();
    assert_eq!(token_data.amount, maker_amount);
}

#[test]
fn test_change_order() {
    let mut svm = LiteSVM::new();
    // ... setup code same as before until order creation ...
    // Load our swap program
    svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
        .unwrap();

    // Setup payer account
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    // Setup two different mints
    let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
    let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
    let mut svm = taker_mint_setup.svm;

    // Mint some tokens to the maker (payer in this case)
    svm = mint_to_ata(
        svm,
        &payer,
        &maker_mint_setup.mint,
        1_000_000,
        &payer.pubkey(),
    )
    .unwrap();

    // Create a taker keypair
    let taker = Keypair::new();

    // Find the PDA for the order account
    let (order_pda, _bump) = Pubkey::find_program_address(
        &[
            b"order",
            payer.pubkey().as_ref(),
            maker_mint_setup.mint.pubkey().as_ref(),
            taker_mint_setup.mint.pubkey().as_ref(),
        ],
        &PROGRAM_KEY,
    );

    // Get maker's ATA for their mint
    let maker_token_ata =
        get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());

    // Get order PDA's ATA for maker's mint
    let order_maker_token_ata =
        get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

    let create_order_ata_ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &order_pda,
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        );

    // Create and send transaction to create ATAs
    let create_atas_tx = Transaction::new_signed_with_payer(
        &[create_order_ata_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_atas_tx).unwrap();

    // Create instruction data
    let maker_amount = 50_000u64;
    let taker_amount = 100_000u64;
    let mut amount_data = vec![0]; // variant 1 for ChangeOrderAmounts
    amount_data.extend_from_slice(&maker_amount.to_le_bytes());
    amount_data.extend_from_slice(&taker_amount.to_le_bytes());

    // Create the transaction
    let initialize_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),           // maker
            AccountMeta::new(order_pda, false),               // order account
            AccountMeta::new(maker_token_ata, false),         // maker's token account
            AccountMeta::new(order_maker_token_ata, false),   // order's token account
            AccountMeta::new_readonly(taker.pubkey(), false), // taker
            AccountMeta::new_readonly(maker_mint_setup.mint.pubkey(), false), // maker token mint
            AccountMeta::new_readonly(taker_mint_setup.mint.pubkey(), false), // taker token mint
            AccountMeta::new_readonly(system_program::id(), false), // system program
            AccountMeta::new_readonly(sysvar::id(), false),   // rent sysvar
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: amount_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[initialize_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    // Send and confirm transaction
    svm.send_transaction(tx).unwrap();

    // Verify the order was created correctly
    let order_account = svm.get_account(&order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();

    assert_eq!(order_data.maker, payer.pubkey());
    assert_eq!(order_data.taker, taker.pubkey());
    assert_eq!(order_data.maker_amount, maker_amount);
    assert_eq!(order_data.taker_amount, taker_amount);

    // Test ChangeOrderAmounts
    let new_maker_amount = 100_000u64;
    let new_taker_amount = 200_000u64;
    let mut change_amount_data = vec![1]; // variant 1 for ChangeOrderAmounts
    change_amount_data.extend_from_slice(&new_maker_amount.to_le_bytes());
    change_amount_data.extend_from_slice(&new_taker_amount.to_le_bytes());

    let change_amounts_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(order_pda, false),
            AccountMeta::new(order_maker_token_ata, false),
            AccountMeta::new(maker_token_ata, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: change_amount_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[change_amounts_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Verify amounts changed
    let order_data = SwapOrder::try_from_slice(&svm.get_account(&order_pda).unwrap().data).unwrap();
    assert_eq!(order_data.maker_amount, new_maker_amount);
    assert_eq!(order_data.taker_amount, new_taker_amount);

    // Test ChangeTaker
    let new_taker = Keypair::new();
    let mut change_taker_data = vec![2]; // variant 2 for ChangeTaker
    change_taker_data.extend_from_slice(&new_taker.pubkey().to_bytes());

    let change_taker_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(order_pda, false),
            AccountMeta::new_readonly(new_taker.pubkey(), false),
        ],
        data: change_taker_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[change_taker_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Verify taker changed
    let order_data = SwapOrder::try_from_slice(&svm.get_account(&order_pda).unwrap().data).unwrap();
    assert_eq!(order_data.taker, new_taker.pubkey());
}

#[test]
fn test_change_taker() {
    let mut svm = LiteSVM::new();

    // Load our swap program
    svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
        .unwrap();

    // Setup payer account
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    // Setup two different mints
    let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
    let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
    let mut svm = taker_mint_setup.svm;

    // Mint some tokens to the maker (payer in this case)
    svm = mint_to_ata(
        svm,
        &payer,
        &maker_mint_setup.mint,
        1_000_000,
        &payer.pubkey(),
    )
    .unwrap();

    // Create a taker keypair
    let taker = Keypair::new();

    // Find the PDA for the order account
    let (order_pda, _bump) = Pubkey::find_program_address(
        &[
            b"order",
            payer.pubkey().as_ref(),
            maker_mint_setup.mint.pubkey().as_ref(),
            taker_mint_setup.mint.pubkey().as_ref(),
        ],
        &PROGRAM_KEY,
    );

    // Get maker's ATA for their mint
    let maker_token_ata =
        get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());

    // Get order PDA's ATA for maker's mint
    let order_maker_token_ata =
        get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

    let create_order_ata_ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &order_pda,
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        );

    // Create and send transaction to create ATAs
    let create_atas_tx = Transaction::new_signed_with_payer(
        &[create_order_ata_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_atas_tx).unwrap();

    // Create instruction data
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let mut ix_data = vec![0]; // variant 0 for InitializeOrder
    ix_data.extend_from_slice(&maker_amount.to_le_bytes());
    ix_data.extend_from_slice(&taker_amount.to_le_bytes());

    // Create the transaction
    let initialize_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),           // maker
            AccountMeta::new(order_pda, false),               // order account
            AccountMeta::new(maker_token_ata, false),         // maker's token account
            AccountMeta::new(order_maker_token_ata, false),   // order's token account
            AccountMeta::new_readonly(taker.pubkey(), false), // taker
            AccountMeta::new_readonly(maker_mint_setup.mint.pubkey(), false), // maker token mint
            AccountMeta::new_readonly(taker_mint_setup.mint.pubkey(), false), // taker token mint
            AccountMeta::new_readonly(system_program::id(), false), // system program
            AccountMeta::new_readonly(sysvar::id(), false),   // rent sysvar
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: ix_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[initialize_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    // Send and confirm transaction
    svm.send_transaction(tx).unwrap();

    // Verify initial taker
    let order_account = svm.get_account(&order_pda).unwrap();
    let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();
    assert_eq!(order_data.taker, taker.pubkey());

    // Test ChangeTaker
    let new_taker = Keypair::new();
    let mut change_taker_data = vec![2]; // variant 2 for ChangeTaker
    change_taker_data.extend_from_slice(&new_taker.pubkey().to_bytes());

    let change_taker_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(order_pda, false),
            AccountMeta::new_readonly(new_taker.pubkey(), false),
        ],
        data: change_taker_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[change_taker_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Verify taker changed
    let order_data = SwapOrder::try_from_slice(&svm.get_account(&order_pda).unwrap().data).unwrap();
    assert_eq!(order_data.taker, new_taker.pubkey());
}

#[test]
fn test_complete_swap() {
    let mut svm = LiteSVM::new();

    // Load our swap program
    svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
        .unwrap();

    // Setup payer account
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    // Setup two different mints
    let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
    let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
    let mut svm = taker_mint_setup.svm;

    // Create a taker keypair
    let taker = Keypair::new();
    svm.airdrop(&taker.pubkey(), 100_000_000_000).unwrap();

    // Mint tokens to both maker and taker
    svm = mint_to_ata(
        svm,
        &payer,
        &maker_mint_setup.mint,
        1_000_000,
        &payer.pubkey(),
    )
    .unwrap();

    svm = mint_to_ata(
        svm,
        &payer,
        &taker_mint_setup.mint,
        1_000_000,
        &taker.pubkey(),
    )
    .unwrap();

    // Find the PDA for the order account
    let (order_pda, _bump) = Pubkey::find_program_address(
        &[
            b"order",
            payer.pubkey().as_ref(),
            maker_mint_setup.mint.pubkey().as_ref(),
            taker_mint_setup.mint.pubkey().as_ref(),
        ],
        &PROGRAM_KEY,
    );

    // Get all necessary ATAs
    let maker_maker_token_ata =
        get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());
    let maker_taker_token_ata =
        get_associated_token_address(&payer.pubkey(), &taker_mint_setup.mint.pubkey());
    let taker_maker_token_ata =
        get_associated_token_address(&taker.pubkey(), &maker_mint_setup.mint.pubkey());
    let taker_taker_token_ata =
        get_associated_token_address(&taker.pubkey(), &taker_mint_setup.mint.pubkey());
    let order_maker_token_ata =
        get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

    // Create all necessary ATAs
    let create_atas_ix = vec![
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &order_pda,
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        ),
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &payer.pubkey(),
            &taker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        ),
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &taker.pubkey(),
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        ),
    ];

    // Create and send transaction to create ATAs
    let create_atas_tx = Transaction::new_signed_with_payer(
        &create_atas_ix,
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_atas_tx).unwrap();

    // Initialize order
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let mut ix_data = vec![0];
    ix_data.extend_from_slice(&maker_amount.to_le_bytes());
    ix_data.extend_from_slice(&taker_amount.to_le_bytes());

    let initialize_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(order_pda, false),
            AccountMeta::new(maker_maker_token_ata, false),
            AccountMeta::new(order_maker_token_ata, false),
            AccountMeta::new_readonly(taker.pubkey(), false),
            AccountMeta::new_readonly(maker_mint_setup.mint.pubkey(), false),
            AccountMeta::new_readonly(taker_mint_setup.mint.pubkey(), false),
            AccountMeta::new_readonly(system_program::id(), false),
            AccountMeta::new_readonly(sysvar::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: ix_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[initialize_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Complete the swap
    let complete_swap_data = vec![3]; // variant 3 for CompleteSwap

    let complete_swap_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(taker.pubkey(), true),         // taker signer
            AccountMeta::new(order_pda, false),             // order PDA
            AccountMeta::new(maker_taker_token_ata, false), // maker's taker token ATA
            AccountMeta::new(taker_taker_token_ata, false), // taker's sending ATA
            AccountMeta::new(taker_maker_token_ata, false), // taker's receiving ATA
            AccountMeta::new(order_maker_token_ata, false), // order's maker token ATA
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: complete_swap_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[complete_swap_ix],
        Some(&taker.pubkey()),
        &[&taker],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Verify the balances after swap
    let maker_taker_token_account = svm.get_account(&maker_taker_token_ata).unwrap();
    let taker_maker_token_account = svm.get_account(&taker_maker_token_ata).unwrap();

    let maker_balance = spl_token::state::Account::unpack(&maker_taker_token_account.data).unwrap();
    let taker_balance = spl_token::state::Account::unpack(&taker_maker_token_account.data).unwrap();

    assert_eq!(maker_balance.amount, taker_amount);
    assert_eq!(taker_balance.amount, maker_amount);

    // Verify the escrow is empty
    let escrow_account = svm.get_account(&order_maker_token_ata).unwrap();
    let escrow_balance = spl_token::state::Account::unpack(&escrow_account.data).unwrap();
    assert_eq!(escrow_balance.amount, 0);
}

#[test]
fn test_close_order() {
    let mut svm = LiteSVM::new();

    // Load our swap program
    svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
        .unwrap();

    // Setup payer account
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    // Setup two different mints
    let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
    let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
    let mut svm = taker_mint_setup.svm;

    // Mint some tokens to the maker (payer in this case)
    svm = mint_to_ata(
        svm,
        &payer,
        &maker_mint_setup.mint,
        1_000_000,
        &payer.pubkey(),
    )
    .unwrap();

    // Create a taker keypair
    let taker = Keypair::new();

    // Find the PDA for the order account
    let (order_pda, _bump) = Pubkey::find_program_address(
        &[
            b"order",
            payer.pubkey().as_ref(),
            maker_mint_setup.mint.pubkey().as_ref(),
            taker_mint_setup.mint.pubkey().as_ref(),
        ],
        &PROGRAM_KEY,
    );

    // Get maker's ATA for their mint
    let maker_token_ata =
        get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());

    // Get order PDA's ATA for maker's mint
    let order_maker_token_ata =
        get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

    let create_order_ata_ix =
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &order_pda,
            &maker_mint_setup.mint.pubkey(),
            &spl_token::id(),
        );

    // Create and send transaction to create ATAs
    let create_atas_tx = Transaction::new_signed_with_payer(
        &[create_order_ata_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(create_atas_tx).unwrap();

    // Create instruction data
    let maker_amount = 100_000u64;
    let taker_amount = 200_000u64;
    let mut ix_data = vec![0]; // variant 0 for InitializeOrder
    ix_data.extend_from_slice(&maker_amount.to_le_bytes());
    ix_data.extend_from_slice(&taker_amount.to_le_bytes());

    // Create the transaction
    let initialize_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),           // maker
            AccountMeta::new(order_pda, false),               // order account
            AccountMeta::new(maker_token_ata, false),         // maker's token account
            AccountMeta::new(order_maker_token_ata, false),   // order's token account
            AccountMeta::new_readonly(taker.pubkey(), false), // taker
            AccountMeta::new_readonly(maker_mint_setup.mint.pubkey(), false), // maker token mint
            AccountMeta::new_readonly(taker_mint_setup.mint.pubkey(), false), // taker token mint
            AccountMeta::new_readonly(system_program::id(), false), // system program
            AccountMeta::new_readonly(sysvar::id(), false),   // rent sysvar
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: ix_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[initialize_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Record initial balances
    let initial_maker_token_balance =
        spl_token::state::Account::unpack(&svm.get_account(&maker_token_ata).unwrap().data)
            .unwrap()
            .amount;

    // Close order
    let close_order_data = vec![4]; // variant 4 for CloseOrder

    let close_order_ix = solana_program::instruction::Instruction {
        program_id: PROGRAM_KEY,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),  // maker as authority
            AccountMeta::new(order_pda, false),      // order PDA
            AccountMeta::new(payer.pubkey(), false), // rent receiver (maker)
            AccountMeta::new(order_maker_token_ata, false), // order's token account
            AccountMeta::new(maker_token_ata, false), // maker's token account
            AccountMeta::new_readonly(spl_token::id(), false), // token program
        ],
        data: close_order_data,
    };

    let tx = Transaction::new_signed_with_payer(
        &[close_order_ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    svm.send_transaction(tx).unwrap();

    // Verify order account is effectively closed
    let closed_order = svm.get_account(&order_pda).unwrap();
    assert_eq!(closed_order.lamports, 0);
    assert_eq!(closed_order.data.len(), SwapOrder::LEN); // Data space remains but should be zeroed
    assert!(closed_order.data.iter().all(|&x| x == 0)); // All bytes should be zero

    // Verify tokens were returned
    let final_maker_token_balance =
        spl_token::state::Account::unpack(&svm.get_account(&maker_token_ata).unwrap().data)
            .unwrap()
            .amount;
    assert_eq!(
        final_maker_token_balance,
        initial_maker_token_balance + maker_amount
    );
}
