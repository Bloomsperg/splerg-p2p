use std::path::PathBuf;

use borsh::BorshDeserialize;
use litesvm::LiteSVM;
use solana_sdk::{
    instruction::AccountMeta, pubkey::Pubkey, rent::sysvar, signature::Keypair, signer::Signer,
    system_program, transaction::Transaction,
};
use spl_associated_token_account::get_associated_token_address;
use splerg_p2p::state::SwapOrder;

use crate::{
    mints::{mint_to_ata, setup_mint},
    PROGRAM_KEY,
};

pub fn load_program(program_name: &str) -> String {
    PathBuf::from("../../target")
        .join("deploy")
        .join(program_name)
        .to_str()
        .unwrap()
        .to_string()
}

pub struct TestSetup {
    pub svm: LiteSVM,
    pub payer: Keypair,
    pub maker_mint: Keypair,
    pub taker_mint: Keypair,
    pub order_pda: Pubkey,
    pub maker_token_ata: Pubkey,
    pub order_maker_token_ata: Pubkey,
}

impl Default for TestSetup {
    fn default() -> Self {
        Self::new()
    }
}

impl TestSetup {
    pub fn new() -> Self {
        let mut svm = LiteSVM::new();

        // Load swap program
        svm.add_program_from_file(PROGRAM_KEY, load_program("splerg_p2p.so"))
            .unwrap();

        // Setup payer
        let payer = Keypair::new();
        svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

        // Setup mints
        let maker_mint_setup = setup_mint(svm, &payer, 9).unwrap();
        let taker_mint_setup = setup_mint(maker_mint_setup.svm, &payer, 9).unwrap();
        let mut svm = taker_mint_setup.svm;

        // Mint tokens to maker
        svm = mint_to_ata(
            svm,
            &payer,
            &maker_mint_setup.mint,
            1_000_000,
            &payer.pubkey(),
        )
        .unwrap();

        // Calculate PDAs and ATAs
        let (order_pda, _) = Pubkey::find_program_address(
            &[
                b"order",
                payer.pubkey().as_ref(),
                maker_mint_setup.mint.pubkey().as_ref(),
                taker_mint_setup.mint.pubkey().as_ref(),
            ],
            &PROGRAM_KEY,
        );

        let maker_token_ata =
            get_associated_token_address(&payer.pubkey(), &maker_mint_setup.mint.pubkey());
        let order_maker_token_ata =
            get_associated_token_address(&order_pda, &maker_mint_setup.mint.pubkey());

        // Create order ATA
        let create_order_ata_ix =
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &order_pda,
                &maker_mint_setup.mint.pubkey(),
                &spl_token::id(),
            );

        let create_atas_tx = Transaction::new_signed_with_payer(
            &[create_order_ata_ix],
            Some(&payer.pubkey()),
            &[&payer],
            svm.latest_blockhash(),
        );

        svm.send_transaction(create_atas_tx).unwrap();

        Self {
            svm,
            payer,
            maker_mint: maker_mint_setup.mint,
            taker_mint: taker_mint_setup.mint,
            order_pda,
            maker_token_ata,
            order_maker_token_ata,
        }
    }

    pub fn initialize_order(&mut self, maker_amount: u64, taker_amount: u64) -> Transaction {
        let mut ix_data = vec![0]; // variant 0 for InitializeOrder
        ix_data.extend_from_slice(&maker_amount.to_le_bytes());
        ix_data.extend_from_slice(&taker_amount.to_le_bytes());

        let initialize_order_ix = solana_program::instruction::Instruction {
            program_id: PROGRAM_KEY,
            accounts: vec![
                AccountMeta::new(self.payer.pubkey(), true),
                AccountMeta::new(self.order_pda, false),
                AccountMeta::new(self.maker_token_ata, false),
                AccountMeta::new(self.order_maker_token_ata, false),
                AccountMeta::new_readonly(self.maker_mint.pubkey(), false),
                AccountMeta::new_readonly(self.taker_mint.pubkey(), false),
                AccountMeta::new_readonly(system_program::id(), false),
                AccountMeta::new_readonly(sysvar::id(), false),
                AccountMeta::new_readonly(spl_token::id(), false),
            ],
            data: ix_data,
        };

        Transaction::new_signed_with_payer(
            &[initialize_order_ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            self.svm.latest_blockhash(),
        )
    }

    pub fn verify_order(&self, expected_maker_amount: u64, expected_taker_amount: u64) {
        let order_account = self.svm.get_account(&self.order_pda).unwrap();
        let order_data = SwapOrder::try_from_slice(&order_account.data).unwrap();

        assert_eq!(order_data.maker, self.payer.pubkey());
        assert_eq!(order_data.maker_amount, expected_maker_amount);
        assert_eq!(order_data.taker_amount, expected_taker_amount);
    }
}
