use litesvm::LiteSVM;
use solana_sdk::{
    program_pack::Pack, pubkey::Pubkey, signature::Keypair, signer::Signer, system_instruction,
    transaction::Transaction,
};
use spl_associated_token_account::instruction::create_associated_token_account;

pub struct MintSetup {
    pub svm: LiteSVM,
    pub mint: Keypair,
}

pub fn setup_mint(
    mut svm: LiteSVM,
    payer: &Keypair,
    decimals: u8,
) -> Result<MintSetup, Box<dyn std::error::Error>> {
    let mint = Keypair::new();
    let mint_len = spl_token::state::Mint::LEN;

    let create_acc_ins = system_instruction::create_account(
        &payer.pubkey(),
        &mint.pubkey(),
        svm.minimum_balance_for_rent_exemption(mint_len),
        mint_len as u64,
        &spl_token::id(),
    );

    let init_mint_ins = spl_token::instruction::initialize_mint2(
        &spl_token::id(),
        &mint.pubkey(),
        &payer.pubkey(),
        None,
        decimals,
    )?;

    svm.send_transaction(Transaction::new_signed_with_payer(
        &[create_acc_ins, init_mint_ins],
        Some(&payer.pubkey()),
        &[payer, &mint],
        svm.latest_blockhash(),
    ))
    .unwrap();

    Ok(MintSetup { svm, mint })
}

pub fn setup_mint_2022(
    mut svm: LiteSVM,
    payer: Keypair,
    decimals: u8,
) -> Result<MintSetup, Box<dyn std::error::Error>> {
    let mint = Keypair::new();
    let mint_len = spl_token_2022::state::Mint::LEN;

    let create_acc_ins = system_instruction::create_account(
        &payer.pubkey(),
        &mint.pubkey(),
        svm.minimum_balance_for_rent_exemption(mint_len),
        mint_len as u64,
        &spl_token_2022::id(),
    );

    let init_mint_ins = spl_token_2022::instruction::initialize_mint2(
        &spl_token_2022::id(),
        &mint.pubkey(),
        &payer.pubkey(),
        None,
        decimals,
    )?;

    svm.send_transaction(Transaction::new_signed_with_payer(
        &[create_acc_ins, init_mint_ins],
        Some(&payer.pubkey()),
        &[&payer, &mint],
        svm.latest_blockhash(),
    ))
    .unwrap();

    Ok(MintSetup { svm, mint })
}

pub fn transfer_to_ata(
    mut svm: LiteSVM,
    payer: &Keypair,
    mint: &Pubkey,
    amount: u64,
    from_authority: &Keypair,
    to_wallet: &Pubkey,
) -> Result<LiteSVM, Box<dyn std::error::Error>> {
    let from_ata =
        spl_associated_token_account::get_associated_token_address(&from_authority.pubkey(), mint);

    let to_ata = spl_associated_token_account::get_associated_token_address(to_wallet, mint);

    // Create destination ATA if it doesn't exist
    if svm.get_account(&to_ata).is_none() {
        let create_ata_ix =
            create_associated_token_account(&payer.pubkey(), to_wallet, mint, &spl_token::id());

        svm.send_transaction(Transaction::new_signed_with_payer(
            &[create_ata_ix],
            Some(&payer.pubkey()),
            &[payer],
            svm.latest_blockhash(),
        ))
        .unwrap();
    }

    // Create transfer instruction
    let transfer_ix = spl_token::instruction::transfer(
        &spl_token::id(),
        &from_ata,
        &to_ata,
        &from_authority.pubkey(),
        &[],
        amount,
    )?;

    svm.send_transaction(Transaction::new_signed_with_payer(
        &[transfer_ix],
        Some(&payer.pubkey()),
        &[payer, from_authority],
        svm.latest_blockhash(),
    ))
    .unwrap();

    Ok(svm)
}

pub fn mint_to_ata(
    mut svm: LiteSVM,
    payer: &Keypair,
    mint: &Keypair,
    amount: u64,
    destination_wallet: &Pubkey,
) -> Result<LiteSVM, Box<dyn std::error::Error>> {
    let destination_ata = spl_associated_token_account::get_associated_token_address(
        destination_wallet,
        &mint.pubkey(),
    );

    // Create destination ATA if it doesn't exist
    if svm.get_account(&destination_ata).is_none() {
        let create_ata_ix = create_associated_token_account(
            &payer.pubkey(),
            destination_wallet,
            &mint.pubkey(),
            &spl_token::id(),
        );

        svm.send_transaction(Transaction::new_signed_with_payer(
            &[create_ata_ix],
            Some(&payer.pubkey()),
            &[payer],
            svm.latest_blockhash(),
        ))
        .unwrap();
    }

    // Create mint-to instruction
    let mint_to_ix = spl_token::instruction::mint_to(
        &spl_token::id(),
        &mint.pubkey(),
        &destination_ata,
        &payer.pubkey(), // This is correct as payer is set as mint authority in setup_mint
        &[&payer.pubkey()], // Add mint authority signer
        amount,
    )?;

    svm.send_transaction(Transaction::new_signed_with_payer(
        &[mint_to_ix],
        Some(&payer.pubkey()),
        &[payer],
        svm.latest_blockhash(),
    ))
    .unwrap();

    Ok(svm)
}

#[test]
fn test_mint() {
    let mut svm = LiteSVM::new();
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 1000000000).unwrap();

    let setup = setup_mint(svm, &payer, 8).unwrap();
    let mint_acc = setup.svm.get_account(&setup.mint.pubkey()).unwrap();

    assert_eq!(mint_acc.owner, spl_token::id());
    assert_eq!(mint_acc.data.len(), spl_token::state::Mint::LEN);
}

#[test]
fn test_mint_2022() {
    let mut svm = LiteSVM::new();
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 1000000000).unwrap();

    let setup = setup_mint_2022(svm, payer, 8).unwrap();
    let mint_acc = setup.svm.get_account(&setup.mint.pubkey()).unwrap();

    assert_eq!(mint_acc.owner, spl_token_2022::id());
    assert_eq!(mint_acc.data.len(), spl_token_2022::state::Mint::LEN);
}

#[test]
fn test_mint_and_transfer() {
    let mut svm = LiteSVM::new();
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 1000000000).unwrap();

    // Setup mint
    let setup = setup_mint(svm, &payer, 8).unwrap();
    let mint = setup.mint;
    let mut svm = setup.svm;

    // Create destination wallet
    let destination = Keypair::new();

    // Mint tokens
    svm = mint_to_ata(svm, &payer, &mint, 1000000, &destination.pubkey()).unwrap();

    // Verify mint
    let destination_ata = spl_associated_token_account::get_associated_token_address(
        &destination.pubkey(),
        &mint.pubkey(),
    );
    let account_data = svm.get_account(&destination_ata).unwrap();
    let token_account = spl_token::state::Account::unpack(&account_data.data).unwrap();
    assert_eq!(token_account.amount, 1000000);

    // Test transfer
    let recipient = Keypair::new();
    svm = transfer_to_ata(
        svm,
        &payer,
        &mint.pubkey(),
        500000,
        &destination,
        &recipient.pubkey(),
    )
    .unwrap();

    // Verify transfer
    let recipient_ata = spl_associated_token_account::get_associated_token_address(
        &recipient.pubkey(),
        &mint.pubkey(),
    );
    let account_data = svm.get_account(&recipient_ata).unwrap();
    let token_account = spl_token::state::Account::unpack(&account_data.data).unwrap();
    assert_eq!(token_account.amount, 500000);
}
