use borsh::BorshDeserialize;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    program_pack::Pack, pubkey::Pubkey, sysvar::rent::Rent,
};

use crate::{error::SwapError, state::SwapOrder};

/// Validates that a mint account is a valid SPL Token or Token-2022 mint
pub fn validate_token_mint(mint_info: &AccountInfo) -> ProgramResult {
    let owner = mint_info.owner;
    if *owner != spl_token::id() && *owner != spl_token_2022::id() {
        return Err(SwapError::InvalidMint.into());
    }

    if *owner == spl_token_2022::id() {
        spl_token_2022::state::Mint::unpack(&mint_info.data.borrow())?;
    } else {
        spl_token::state::Mint::unpack(&mint_info.data.borrow())?;
    }

    Ok(())
}

/// Validates that a mint account's owning program matches the expected program
pub fn validate_token_program(mint_info: &AccountInfo, token_program: &Pubkey) -> ProgramResult {
    if *token_program != spl_token::id() && *token_program != spl_token_2022::id() {
        return Err(SwapError::InvalidTokenProgram.into());
    }

    if mint_info.owner != token_program {
        return Err(SwapError::InvalidTokenProgram.into());
    }

    Ok(())
}

/// Validates a token account's owner and mint
pub fn validate_token_account(
    account: &AccountInfo,
    expected_owner: &Pubkey,
    expected_mint: &Pubkey,
) -> ProgramResult {
    if account.owner == &spl_token::id() {
        let account_data = spl_token::state::Account::unpack(&account.data.borrow())?;
        if account_data.owner != *expected_owner || account_data.mint != *expected_mint {
            return Err(SwapError::InvalidTokenAccount.into());
        }
    } else if account.owner == &spl_token_2022::id() {
        let account_data = spl_token_2022::state::Account::unpack(&account.data.borrow())?;
        if account_data.owner != *expected_owner || account_data.mint != *expected_mint {
            return Err(SwapError::InvalidTokenAccount.into());
        }
    } else {
        return Err(SwapError::InvalidTokenAccount.into());
    }

    Ok(())
}

/// Validates that an account is a signer
pub fn validate_signer(account: &AccountInfo) -> ProgramResult {
    if !account.is_signer {
        return Err(SwapError::UnauthorizedSigner.into());
    }
    Ok(())
}

/// Validates that the account is the expected authority
pub fn validate_authority(authority: &AccountInfo, order: &SwapOrder) -> ProgramResult {
    validate_signer(authority)?;
    if order.maker != *authority.key {
        return Err(SwapError::UnauthorizedSigner.into());
    }
    Ok(())
}

/// Validate on if the order is open or closed
pub fn validate_taker(taker: &AccountInfo, order: &SwapOrder) -> ProgramResult {
    if order.taker == Pubkey::default() {
        return Ok(());
    }

    validate_signer(taker)?;
    if order.taker != *taker.key {
        return Err(SwapError::UnauthorizedSigner.into());
    }

    Ok(())
}

/// Validates non-zero amounts for the initialization ix
pub fn validate_init_amounts(maker_amount: u64, taker_amount: u64) -> ProgramResult {
    if maker_amount == 0 || taker_amount == 0 {
        return Err(SwapError::InvalidAmount.into());
    }
    Ok(())
}

/// Validates that an account is rent-exempt
pub fn validate_rent_exempt(rent: &Rent, account: &AccountInfo) -> ProgramResult {
    if !rent.is_exempt(account.lamports(), account.data_len()) {
        return Err(ProgramError::AccountNotRentExempt);
    }
    Ok(())
}

/// Validates that an account is the System Program
pub fn validate_system_program(program: &Pubkey) -> ProgramResult {
    if !solana_program::system_program::check_id(program) {
        return Err(ProgramError::IncorrectProgramId);
    }
    Ok(())
}

/// Validates that an account is the Rent Sysvar
pub fn validate_rent_sysvar(rent: &Pubkey) -> ProgramResult {
    if !solana_program::sysvar::rent::check_id(rent) {
        return Err(ProgramError::InvalidArgument);
    }
    Ok(())
}

/// Get order PDA
pub fn get_order_pda(
    program_id: &Pubkey,
    maker: &Pubkey,
    maker_mint: &Pubkey,
    taker_mint: &Pubkey,
) -> Result<(Pubkey, u8), ProgramError> {
    let (pda, bump) = Pubkey::find_program_address(
        &[
            b"order",
            maker.as_ref(),
            maker_mint.as_ref(),
            taker_mint.as_ref(),
        ],
        program_id,
    );
    Ok((pda, bump))
}

/// Validate order PDA
pub fn validate_order_pda(
    program_id: &Pubkey,
    account_info: &AccountInfo,
) -> Result<(SwapOrder, u8), ProgramError> {
    let order = SwapOrder::try_from_slice(&account_info.data.borrow())?;
    let (pda, bump) = get_order_pda(
        program_id,
        &order.maker,
        &order.maker_token_mint,
        &order.taker_token_mint,
    )?;

    if pda != *account_info.key || order.bump != bump {
        return Err(SwapError::InvalidOrderState.into());
    }

    Ok((order, bump))
}
