use spl_token_2022::check_spl_token_program_account;

use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        program::{invoke, invoke_signed},
        program_error::ProgramError,
        program_pack::Pack,
        pubkey::Pubkey,
        system_instruction,
        sysvar::rent::Rent,
        sysvar::Sysvar,
    },
};

use crate::{
    error::SwapError,
    instruction::SwapInstruction,
    state::SwapOrder,
    validation::{is_token_program_valid_for_mint, is_valid_token_account, is_valid_token_mint},
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
        let maker_mint_ata_info = next_account_info(account_info_iter)?;
        let order_maker_mint_ata_info = next_account_info(account_info_iter)?;
        let taker_info = next_account_info(account_info_iter)?;
        let maker_token_mint_info = next_account_info(account_info_iter)?;
        let taker_token_mint_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        /* Validation */

        if !maker_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        if maker_amount == 0 || taker_amount == 0 {
            return Err(SwapError::InvalidAmount.into());
        }

        if !is_valid_token_mint(maker_token_mint_info)?
            || !is_valid_token_mint(taker_token_mint_info)?
        {
            return Err(SwapError::InvalidMint.into());
        }

        check_spl_token_program_account(token_program.key)?;

        if !is_token_program_valid_for_mint(maker_token_mint_info, token_program.key)? {
            return Err(SwapError::InvalidTokenProgram.into());
        }

        if !is_valid_token_account(
            maker_mint_ata_info,
            maker_info.key,
            maker_token_mint_info.key,
        )? {
            return Err(SwapError::InvalidTokenAccount.into());
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

        if !is_valid_token_account(
            order_maker_mint_ata_info,
            &order_pda,
            maker_token_mint_info.key,
        )? {
            return Err(SwapError::InvalidTokenAccount.into());
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

        let transfer_instruction = if *token_program.key == spl_token::id() {
            spl_token::instruction::transfer(
                token_program.key,
                maker_mint_ata_info.key,
                order_maker_mint_ata_info.key,
                maker_info.key,
                &[],
                maker_amount,
            )?
        } else {
            let account_data =
                spl_token_2022::state::Mint::unpack(&maker_token_mint_info.data.borrow())?;
            spl_token_2022::instruction::transfer_checked(
                token_program.key,
                maker_mint_ata_info.key,
                maker_token_mint_info.key,
                order_maker_mint_ata_info.key,
                maker_info.key,
                &[],
                maker_amount,
                account_data.decimals,
            )?
        };

        invoke(
            &transfer_instruction,
            &[
                maker_mint_ata_info.clone(),
                order_maker_mint_ata_info.clone(),
                maker_info.clone(),
                token_program.clone(),
            ],
        )?;

        let order = SwapOrder::new(
            *maker_info.key,
            *taker_info.key,
            *maker_token_mint_info.key,
            *taker_token_mint_info.key,
            maker_amount,
            taker_amount,
            bump_seed,
        );

        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }
}
