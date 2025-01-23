use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        program::invoke_signed,
        program_error::ProgramError,
        pubkey::Pubkey,
        system_instruction,
        sysvar::rent::Rent,
        sysvar::Sysvar,
    },
};

use crate::{
    error::SwapError, instruction::SwapInstruction, state::SwapOrder,
    validation::is_valid_token_mint,
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = SwapInstruction::try_from_slice(instruction_data)?;

        match instruction {
            SwapInstruction::InitializeOrder {
                maker_amount,
                taker_amount,
            } => Self::process_initialize_order(program_id, accounts, maker_amount, taker_amount),
            SwapInstruction::DepositMakerTokens => todo!(),
            SwapInstruction::AssignTaker => todo!(),
            SwapInstruction::CompleteSwap => todo!(),
            SwapInstruction::CloseOrder => todo!(),
        }
    }

    fn process_initialize_order(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        maker_amount: u64,
        taker_amount: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let maker_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let maker_token_mint_info = next_account_info(account_info_iter)?;
        let taker_token_mint_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        if !maker_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        if maker_amount == 0 {
            return Err(SwapError::InvalidAmount.into());
        }

        if taker_amount == 0 {
            return Err(SwapError::InvalidAmount.into());
        }

        if !is_valid_token_mint(maker_token_mint_info)? {
            return Err(SwapError::InvalidMint.into());
        }

        if !is_valid_token_mint(taker_token_mint_info)? {
            return Err(SwapError::InvalidMint.into());
        }

        if *system_program_info.key != solana_program::system_program::id() {
            return Err(ProgramError::IncorrectProgramId);
        }

        if *rent_info.key != solana_program::sysvar::rent::id() {
            return Err(ProgramError::InvalidArgument);
        }

        let (order_pda, bump_seed) = Pubkey::find_program_address(
            &[
                b"order",
                maker_info.key.as_ref(),
                maker_token_mint_info.key.as_ref(),
                taker_token_mint_info.key.as_ref(),
            ],
            program_id,
        );

        if order_pda != *order_account_info.key {
            return Err(ProgramError::InvalidSeeds);
        }

        let rent = Rent::from_account_info(rent_info)?;
        let space = SwapOrder::LEN;
        let rent_lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                maker_info.key,
                &order_pda,
                rent_lamports,
                space as u64,
                program_id,
            ),
            &[
                maker_info.clone(),
                order_account_info.clone(),
                system_program_info.clone(),
            ],
            &[&[
                b"order",
                maker_info.key.as_ref(),
                maker_token_mint_info.key.as_ref(),
                taker_token_mint_info.key.as_ref(),
                &[bump_seed],
            ]],
        )?;

        let order = SwapOrder::new(
            *maker_info.key,
            *maker_token_mint_info.key,
            *taker_token_mint_info.key,
            maker_amount,
            taker_amount,
        );

        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }
}
