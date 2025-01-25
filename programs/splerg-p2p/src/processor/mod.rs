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
            SwapInstruction::ChangeOrderAmounts {
                new_maker_amount,
                new_taker_amount,
            } => Self::process_change_order_amounts(accounts, new_maker_amount, new_taker_amount),
            SwapInstruction::ChangeTaker { new_taker } => {
                Self::process_change_taker(accounts, new_taker)
            }
            SwapInstruction::CompleteSwap => Self::process_complete_swap(accounts),
            SwapInstruction::CloseOrder => Self::process_close_order(accounts),
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

    fn process_change_order_amounts(
        accounts: &[AccountInfo],
        new_maker_amount: u64,
        new_taker_amount: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let maker_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let escrow_token_account = next_account_info(account_info_iter)?;
        let maker_token_account = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        if !maker_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        let mut order = SwapOrder::try_from_slice(&order_account_info.data.borrow())?;
        if order.maker != *maker_info.key {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        if new_maker_amount == 0 || new_taker_amount == 0 {
            return Err(SwapError::InvalidAmount.into());
        }

        // Get current escrow balance
        let escrow_token_data =
            spl_token::state::Account::unpack(&escrow_token_account.data.borrow())?;
        let current_escrow_amount = escrow_token_data.amount;

        match new_maker_amount.cmp(&current_escrow_amount) {
            std::cmp::Ordering::Greater => {
                // Need to transfer additional tokens to escrow
                let additional_amount = new_maker_amount - current_escrow_amount;

                invoke(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        maker_token_account.key,
                        escrow_token_account.key,
                        maker_info.key,
                        &[],
                        additional_amount,
                    )?,
                    &[
                        maker_token_account.clone(),
                        escrow_token_account.clone(),
                        maker_info.clone(),
                        token_program.clone(),
                    ],
                )?;
            }
            std::cmp::Ordering::Less => {
                // Need to refund tokens to maker
                let refund_amount = current_escrow_amount - new_maker_amount;

                invoke_signed(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        escrow_token_account.key,
                        maker_token_account.key,
                        order_account_info.key,
                        &[],
                        refund_amount,
                    )?,
                    &[
                        escrow_token_account.clone(),
                        maker_token_account.clone(),
                        order_account_info.clone(),
                        token_program.clone(),
                    ],
                    &[&[
                        b"order",
                        maker_info.key.as_ref(),
                        &order.maker_token_mint.to_bytes(),
                        &order.taker_token_mint.to_bytes(),
                        &[order.bump],
                    ]],
                )?;
            }
            std::cmp::Ordering::Equal => {} // No token transfer needed
        }

        order.maker_amount = new_maker_amount;
        order.taker_amount = new_taker_amount;
        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_change_taker(accounts: &[AccountInfo], new_taker: [u8; 32]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let maker_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let new_taker_info = next_account_info(account_info_iter)?;

        if !maker_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        let mut order = SwapOrder::try_from_slice(&order_account_info.data.borrow())?;
        if order.maker != *maker_info.key {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        if Pubkey::new_from_array(new_taker) != *new_taker_info.key {
            return Err(ProgramError::InvalidArgument);
        }

        order.taker = Pubkey::new_from_array(new_taker);
        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_complete_swap(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let taker_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let maker_taker_mint_ata = next_account_info(account_info_iter)?; // Maker's ATA for taker's token
        let taker_sending_ata = next_account_info(account_info_iter)?; // Taker's sending account
        let taker_maker_mint_ata = next_account_info(account_info_iter)?; // Taker's ATA for maker's token
        let order_maker_token_ata = next_account_info(account_info_iter)?; // Order's maker token account
        let token_program = next_account_info(account_info_iter)?;

        if !taker_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        let order = SwapOrder::try_from_slice(&order_account_info.data.borrow())?;
        if order.taker != *taker_info.key {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        // Verify we have enough tokens in escrow
        let escrow_token_data =
            spl_token::state::Account::unpack(&order_maker_token_ata.data.borrow())?;
        if escrow_token_data.amount < order.maker_amount {
            return Err(SwapError::InsufficientFunds.into());
        }

        // Transfer taker tokens directly to maker's ATA
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,
                taker_sending_ata.key,
                maker_taker_mint_ata.key,
                taker_info.key,
                &[],
                order.taker_amount,
            )?,
            &[
                taker_sending_ata.clone(),
                maker_taker_mint_ata.clone(),
                taker_info.clone(),
                token_program.clone(),
            ],
        )?;

        // Transfer maker tokens from escrow to taker
        invoke_signed(
            &spl_token::instruction::transfer(
                token_program.key,
                order_maker_token_ata.key,
                taker_maker_mint_ata.key,
                order_account_info.key,
                &[],
                order.maker_amount,
            )?,
            &[
                order_maker_token_ata.clone(),
                taker_maker_mint_ata.clone(),
                order_account_info.clone(),
                token_program.clone(),
            ],
            &[&[
                b"order",
                &order.maker.to_bytes(),
                &order.maker_token_mint.to_bytes(),
                &order.taker_token_mint.to_bytes(),
                &[order.bump],
            ]],
        )?;

        Ok(())
    }

    fn process_close_order(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?; // could be maker or taker
        let order_account_info = next_account_info(account_info_iter)?;
        let rent_receiver = next_account_info(account_info_iter)?;
        let order_token_ata = next_account_info(account_info_iter)?;
        let maker_token_ata = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        if !authority_info.is_signer {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        let order = SwapOrder::try_from_slice(&order_account_info.data.borrow())?;

        // Check if the signer is either maker or taker
        if *authority_info.key != order.maker && *authority_info.key != order.taker {
            return Err(SwapError::UnauthorizedSigner.into());
        }

        // Check if there are tokens to return
        let token_data = spl_token::state::Account::unpack(&order_token_ata.data.borrow())?;
        if token_data.amount > 0 {
            // Return any remaining tokens to maker
            invoke_signed(
                &spl_token::instruction::transfer(
                    token_program.key,
                    order_token_ata.key,
                    maker_token_ata.key,
                    order_account_info.key,
                    &[],
                    token_data.amount,
                )?,
                &[
                    order_token_ata.clone(),
                    maker_token_ata.clone(),
                    order_account_info.clone(),
                    token_program.clone(),
                ],
                &[&[
                    b"order",
                    &order.maker.to_bytes(),
                    &order.maker_token_mint.to_bytes(),
                    &order.taker_token_mint.to_bytes(),
                    &[order.bump],
                ]],
            )?;
        }

        // Close the token account
        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                order_token_ata.key,
                rent_receiver.key,
                order_account_info.key,
                &[],
            )?,
            &[
                order_token_ata.clone(),
                rent_receiver.clone(),
                order_account_info.clone(),
            ],
            &[&[
                b"order",
                &order.maker.to_bytes(),
                &order.maker_token_mint.to_bytes(),
                &order.taker_token_mint.to_bytes(),
                &[order.bump],
            ]],
        )?;

        // Transfer lamports to rent receiver and zero the account
        let rent_lamports = order_account_info.lamports();
        **order_account_info.lamports.borrow_mut() = 0;
        **rent_receiver.lamports.borrow_mut() += rent_lamports;

        // Clear the data
        order_account_info.data.borrow_mut().fill(0);

        Ok(())
    }
}
