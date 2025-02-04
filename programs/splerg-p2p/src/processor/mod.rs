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
    math::fee::calculate_token_fee,
    state::{SwapOrder, Treasury},
    utils::get_mint_decimals,
    validation::{
        get_order_pda, get_treasury_pda, validate_authority, validate_init_amounts, validate_mint,
        validate_order_pda, validate_rent_sysvar, validate_signer, validate_system_program,
        validate_taker, validate_token_account, validate_token_mint, validate_token_program,
        validate_treasury_authority,
    },
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
            SwapInstruction::InitializeTreasury { authority, fee } => {
                Self::process_initialize_treasury(program_id, accounts, authority, fee)
            }
            SwapInstruction::UpdateTreasuryAuthority { authority, fee } => {
                Self::process_update_treasury_authority(accounts, authority, fee)
            }
            SwapInstruction::Harvest => Self::process_harvest(accounts),
            SwapInstruction::InitializeOrder {
                maker_amount,
                taker_amount,
            } => Self::process_initialize_order(program_id, accounts, maker_amount, taker_amount),
            SwapInstruction::ChangeOrderAmounts {
                new_maker_amount,
                new_taker_amount,
            } => Self::process_change_order_amounts(
                program_id,
                accounts,
                new_maker_amount,
                new_taker_amount,
            ),
            SwapInstruction::ChangeTaker { new_taker } => {
                Self::process_change_taker(accounts, new_taker)
            }
            SwapInstruction::CompleteSwap => Self::process_complete_swap(program_id, accounts),
            SwapInstruction::CloseOrder => Self::process_close_order(program_id, accounts),
        }
    }

    fn process_initialize_treasury(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        authority: [u8; 32],
        fee: u16,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let payer_info = next_account_info(account_info_iter)?;
        let treasury_account_info = next_account_info(account_info_iter)?;
        let authority_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;

        validate_signer(payer_info)?;
        validate_system_program(system_program_info.key)?;
        validate_rent_sysvar(rent_info.key)?;

        let authority_pubkey = Pubkey::new_from_array(authority);
        if authority_pubkey != *authority_info.key {
            return Err(ProgramError::InvalidArgument);
        }

        let (treasury_pda, bump) = get_treasury_pda(program_id)?;
        if treasury_pda != *treasury_account_info.key {
            return Err(ProgramError::InvalidArgument);
        }

        let rent = Rent::from_account_info(rent_info)?;
        let space = Treasury::LEN;
        let rent_lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                payer_info.key,
                treasury_account_info.key,
                rent_lamports,
                space as u64,
                program_id,
            ),
            &[
                payer_info.clone(),
                treasury_account_info.clone(),
                system_program_info.clone(),
            ],
            &[&[b"treasury", &[bump]]],
        )?;

        let treasury = Treasury::new(authority_pubkey, fee, bump);
        treasury.serialize(&mut *treasury_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_update_treasury_authority(
        accounts: &[AccountInfo],
        new_authority: [u8; 32],
        fee: u16,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?;
        let treasury_account_info = next_account_info(account_info_iter)?;
        let new_authority_info = next_account_info(account_info_iter)?;

        validate_treasury_authority(treasury_account_info, authority_info)?;

        let new_authority_pubkey = Pubkey::new_from_array(new_authority);
        if new_authority_pubkey != *new_authority_info.key {
            return Err(ProgramError::InvalidArgument);
        }

        let mut treasury = Treasury::try_from_slice(&treasury_account_info.data.borrow())?;
        treasury.authority = new_authority_pubkey;
        treasury.fee = fee;
        treasury.serialize(&mut *treasury_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_harvest(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?;
        let treasury_account_info = next_account_info(account_info_iter)?;
        let treasury_token_ata = next_account_info(account_info_iter)?;
        let receiver_token_ata = next_account_info(account_info_iter)?;
        let token_mint_info = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        // Validate accounts
        validate_treasury_authority(treasury_account_info, authority_info)?;
        check_spl_token_program_account(token_program.key)?;
        validate_token_mint(token_mint_info)?;
        validate_token_account(
            treasury_token_ata,
            treasury_account_info.key,
            token_mint_info.key,
        )?;
        validate_token_account(receiver_token_ata, authority_info.key, token_mint_info.key)?;

        let treasury = Treasury::try_from_slice(&treasury_account_info.data.borrow())?;

        // Get the treasury token account balance
        let treasury_token_data =
            spl_token::state::Account::unpack(&treasury_token_ata.data.borrow())?;
        let balance = treasury_token_data.amount;

        if balance == 0 {
            return Err(SwapError::InsufficientFunds.into());
        }

        let decimals = get_mint_decimals(token_mint_info)?;

        // Transfer full balance from treasury to receiver
        if *token_program.key == spl_token::id() {
            invoke_signed(
                &spl_token::instruction::transfer(
                    token_program.key,
                    treasury_token_ata.key,
                    receiver_token_ata.key,
                    treasury_account_info.key,
                    &[],
                    balance,
                )?,
                &[
                    treasury_token_ata.clone(),
                    receiver_token_ata.clone(),
                    treasury_account_info.clone(),
                    token_program.clone(),
                ],
                &[&[b"treasury", &[treasury.bump]]],
            )?;
        } else {
            invoke_signed(
                &spl_token_2022::instruction::transfer_checked(
                    token_program.key,
                    treasury_token_ata.key,
                    token_mint_info.key,
                    receiver_token_ata.key,
                    treasury_account_info.key,
                    &[],
                    balance,
                    decimals,
                )?,
                &[
                    treasury_token_ata.clone(),
                    receiver_token_ata.clone(),
                    treasury_account_info.clone(),
                    token_program.clone(),
                ],
                &[&[b"treasury", &[treasury.bump]]],
            )?;
        }

        Ok(())
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
        let maker_mint_info = next_account_info(account_info_iter)?;
        let taker_mint_info = next_account_info(account_info_iter)?;
        let system_program_info = next_account_info(account_info_iter)?;
        let rent_info = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        validate_signer(maker_info)?;
        validate_init_amounts(maker_amount, taker_amount)?;
        validate_token_mint(maker_mint_info)?;
        validate_token_mint(taker_mint_info)?;
        check_spl_token_program_account(token_program.key)?;
        validate_token_program(maker_mint_info, token_program.key)?;
        validate_token_account(maker_mint_ata_info, maker_info.key, maker_mint_info.key)?;
        validate_system_program(system_program_info.key)?;
        validate_rent_sysvar(rent_info.key)?;
        validate_token_account(
            order_maker_mint_ata_info,
            order_account_info.key,
            maker_mint_info.key,
        )?;

        let (_, bump) = get_order_pda(
            program_id,
            maker_info.key,
            maker_mint_info.key,
            taker_mint_info.key,
        )?;

        let rent = Rent::from_account_info(rent_info)?;
        let space = SwapOrder::LEN;
        let rent_lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                maker_info.key,
                order_account_info.key,
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
                maker_mint_info.key.as_ref(),
                taker_mint_info.key.as_ref(),
                &[bump],
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
            let account_data = spl_token_2022::state::Mint::unpack(&maker_mint_info.data.borrow())?;
            spl_token_2022::instruction::transfer_checked(
                token_program.key,
                maker_mint_ata_info.key,
                maker_mint_info.key,
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
            *maker_mint_info.key,
            *taker_mint_info.key,
            maker_amount,
            taker_amount,
            bump,
        );

        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_change_order_amounts(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        new_maker_amount: u64,
        new_taker_amount: u64,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let maker_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let order_token_account = next_account_info(account_info_iter)?;
        let maker_token_account = next_account_info(account_info_iter)?;
        let mint_info = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;

        let (mut order, _) = validate_order_pda(program_id, order_account_info)?;

        validate_authority(maker_info, &order)?;
        validate_mint(mint_info, &order.maker_token_mint)?;
        check_spl_token_program_account(token_program.key)?;
        validate_token_account(
            order_token_account,
            order_account_info.key,
            &order.maker_token_mint,
        )?;
        validate_token_account(
            order_token_account,
            order_account_info.key,
            &order.maker_token_mint,
        )?;

        // Get current escrow balance
        let escrow_token_data =
            spl_token::state::Account::unpack(&order_token_account.data.borrow())?;
        let current_escrow_amount = escrow_token_data.amount;

        let decimals = get_mint_decimals(mint_info)?;

        match new_maker_amount.cmp(&current_escrow_amount) {
            std::cmp::Ordering::Greater => {
                // Need to transfer additional tokens to escrow
                let additional_amount = new_maker_amount - current_escrow_amount;

                if *token_program.key == spl_token::id() {
                    invoke(
                        &spl_token::instruction::transfer(
                            token_program.key,
                            maker_token_account.key,
                            order_token_account.key,
                            maker_info.key,
                            &[],
                            additional_amount,
                        )?,
                        &[
                            maker_token_account.clone(),
                            order_token_account.clone(),
                            maker_info.clone(),
                            token_program.clone(),
                        ],
                    )?;
                } else {
                    invoke(
                        &spl_token_2022::instruction::transfer_checked(
                            token_program.key,
                            maker_token_account.key,
                            mint_info.key,
                            order_token_account.key,
                            maker_info.key,
                            &[],
                            additional_amount,
                            decimals,
                        )?,
                        &[
                            maker_token_account.clone(),
                            order_token_account.clone(),
                            maker_info.clone(),
                            token_program.clone(),
                        ],
                    )?;
                }
            }
            std::cmp::Ordering::Less => {
                // Need to refund tokens to maker
                let refund_amount = current_escrow_amount - new_maker_amount;

                if *token_program.key == spl_token::id() {
                    invoke_signed(
                        &spl_token::instruction::transfer(
                            token_program.key,
                            order_token_account.key,
                            maker_token_account.key,
                            order_account_info.key,
                            &[],
                            refund_amount,
                        )?,
                        &[
                            order_token_account.clone(),
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
                } else {
                    invoke_signed(
                        &spl_token_2022::instruction::transfer_checked(
                            token_program.key,
                            order_token_account.key,
                            mint_info.key,
                            maker_token_account.key,
                            order_account_info.key,
                            &[],
                            refund_amount,
                            decimals,
                        )?,
                        &[
                            order_token_account.clone(),
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
            }
            std::cmp::Ordering::Equal => {}
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

        let mut order = SwapOrder::try_from_slice(&order_account_info.data.borrow())?;
        validate_authority(maker_info, &order)?;

        if Pubkey::new_from_array(new_taker) != *new_taker_info.key {
            return Err(ProgramError::InvalidArgument);
        }

        order.taker = Pubkey::new_from_array(new_taker);
        order.serialize(&mut *order_account_info.data.borrow_mut())?;

        Ok(())
    }

    fn process_complete_swap(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();
        let taker_info = next_account_info(account_info_iter)?;
        let maker_mint = next_account_info(account_info_iter)?;
        let taker_mint = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;
        let maker_taker_ata = next_account_info(account_info_iter)?;
        let taker_ata = next_account_info(account_info_iter)?;
        let taker_maker_ata = next_account_info(account_info_iter)?;
        let order_maker_ata = next_account_info(account_info_iter)?;
        let treasury_account_info = next_account_info(account_info_iter)?;
        let treasury_maker_ata = next_account_info(account_info_iter)?;
        let treasury_taker_ata = next_account_info(account_info_iter)?;
        let token_program = next_account_info(account_info_iter)?;
        let token_program_2022 = next_account_info(account_info_iter)?;

        let (order, _) = validate_order_pda(program_id, order_account_info)?;
        validate_taker(taker_info, &order)?;
        validate_mint(maker_mint, &order.maker_token_mint)?;
        validate_mint(taker_mint, &order.taker_token_mint)?;

        check_spl_token_program_account(token_program.key)?;
        validate_token_account(maker_taker_ata, &order.maker, &order.taker_token_mint)?;
        validate_token_account(taker_maker_ata, taker_info.key, &order.maker_token_mint)?;
        validate_token_account(taker_ata, taker_info.key, &order.taker_token_mint)?;
        validate_token_account(
            order_maker_ata,
            order_account_info.key,
            &order.maker_token_mint,
        )?;

        // Verify we have enough tokens in escrow
        let escrow_token_data = spl_token::state::Account::unpack(&order_maker_ata.data.borrow())?;
        if escrow_token_data.amount < order.maker_amount {
            return Err(SwapError::InsufficientFunds.into());
        }

        let treasury = Treasury::try_from_slice(&treasury_account_info.data.borrow())?;

        let maker_fee = calculate_token_fee(order.maker_amount.into(), treasury.fee)
            .map_err(|_| ProgramError::from(SwapError::Overflow))?;
        let taker_fee = calculate_token_fee(order.taker_amount.into(), treasury.fee)
            .map_err(|_| ProgramError::from(SwapError::Overflow))?;

        let maker_amount_after_fee = order
            .maker_amount
            .checked_sub(maker_fee.try_into().map_err(|_| SwapError::Overflow)?)
            .ok_or(SwapError::Overflow)?;
        let taker_amount_after_fee = order
            .taker_amount
            .checked_sub(taker_fee.try_into().map_err(|_| SwapError::Overflow)?)
            .ok_or(SwapError::Overflow)?;

        let taker_decimals = get_mint_decimals(taker_mint)?;
        let maker_decimals = get_mint_decimals(maker_mint)?;

        // transfer taker tokens from taker directly -> maker's taker mint
        if taker_mint.owner == &spl_token::id() {
            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    taker_ata.key,
                    maker_taker_ata.key,
                    taker_info.key,
                    &[],
                    taker_amount_after_fee,
                )?,
                &[
                    taker_ata.clone(),
                    maker_taker_ata.clone(),
                    taker_info.clone(),
                    token_program.clone(),
                ],
            )?;
        } else {
            invoke(
                &spl_token_2022::instruction::transfer_checked(
                    token_program_2022.key,
                    taker_ata.key,
                    taker_mint.key,
                    maker_taker_ata.key,
                    taker_info.key,
                    &[],
                    taker_amount_after_fee,
                    taker_decimals,
                )?,
                &[
                    taker_ata.clone(),
                    maker_taker_ata.clone(),
                    taker_info.clone(),
                    token_program_2022.clone(),
                ],
            )?;
        }

        if *token_program.key == spl_token::id() {
            invoke_signed(
                &spl_token::instruction::transfer(
                    token_program.key,
                    order_maker_ata.key,
                    taker_maker_ata.key,
                    order_account_info.key,
                    &[],
                    maker_amount_after_fee,
                )?,
                &[
                    order_maker_ata.clone(),
                    taker_maker_ata.clone(),
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
        } else {
            invoke_signed(
                &spl_token_2022::instruction::transfer_checked(
                    token_program_2022.key,
                    order_maker_ata.key,
                    maker_mint.key,
                    taker_maker_ata.key,
                    order_account_info.key,
                    &[],
                    maker_amount_after_fee,
                    maker_decimals,
                )?,
                &[
                    order_maker_ata.clone(),
                    taker_maker_ata.clone(),
                    order_account_info.clone(),
                    token_program_2022.clone(),
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

        if maker_fee > 0 {
            if *token_program.key == spl_token::id() {
                invoke_signed(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        order_maker_ata.key,
                        treasury_maker_ata.key,
                        order_account_info.key,
                        &[],
                        maker_fee.try_into().unwrap(),
                    )?,
                    &[
                        order_maker_ata.clone(),
                        treasury_maker_ata.clone(),
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
            } else {
                invoke_signed(
                    &spl_token_2022::instruction::transfer_checked(
                        token_program_2022.key,
                        order_maker_ata.key,
                        maker_mint.key,
                        treasury_maker_ata.key,
                        order_account_info.key,
                        &[],
                        maker_fee.try_into().unwrap(),
                        maker_decimals,
                    )?,
                    &[
                        order_maker_ata.clone(),
                        treasury_maker_ata.clone(),
                        order_account_info.clone(),
                        token_program_2022.clone(),
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
        }

        if taker_fee > 0 {
            if *token_program.key == spl_token::id() {
                invoke_signed(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        taker_ata.key,
                        treasury_taker_ata.key,
                        taker_info.key,
                        &[],
                        taker_fee.try_into().unwrap(),
                    )?,
                    &[
                        taker_ata.clone(),
                        treasury_taker_ata.clone(),
                        taker_info.clone(),
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
            } else {
                invoke_signed(
                    &spl_token_2022::instruction::transfer_checked(
                        token_program_2022.key,
                        taker_ata.key,
                        taker_mint.key,
                        treasury_taker_ata.key,
                        taker_info.key,
                        &[],
                        taker_fee.try_into().unwrap(),
                        taker_decimals,
                    )?,
                    &[
                        taker_ata.clone(),
                        treasury_taker_ata.clone(),
                        taker_info.clone(),
                        token_program_2022.clone(),
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
        }

        Ok(())
    }

    fn process_close_order(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let authority_info = next_account_info(account_info_iter)?;
        let order_account_info = next_account_info(account_info_iter)?;

        let (order, _) = validate_order_pda(program_id, order_account_info)?;
        validate_authority(authority_info, &order)?;

        // Transfer rent to authority
        let rent_lamports = order_account_info.lamports();
        **order_account_info.lamports.borrow_mut() = 0;
        **authority_info.lamports.borrow_mut() += rent_lamports;

        // Clear the account data
        order_account_info.data.borrow_mut().fill(0);

        Ok(())
    }
}
