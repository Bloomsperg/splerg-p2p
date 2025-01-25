use solana_program::{
    account_info::AccountInfo, program_error::ProgramError, program_pack::Pack, pubkey::Pubkey,
};

/// Validates that a mint account is a valid SPL Token or Token-2022 mint
pub fn is_valid_token_mint(mint_info: &AccountInfo) -> Result<bool, ProgramError> {
    // Check if owned by either token program
    let owner = mint_info.owner;
    if *owner != spl_token::id() && *owner != spl_token_2022::id() {
        return Ok(false);
    }

    // Validate based on the owner program
    let is_valid = if *owner == spl_token_2022::id() {
        // Token-2022 validation
        mint_info.data_len() == spl_token_2022::state::Mint::LEN
            && spl_token_2022::state::Mint::unpack(&mint_info.data.borrow()).is_ok()
    } else {
        // SPL Token validation
        mint_info.data_len() == spl_token::state::Mint::LEN
            && spl_token::state::Mint::unpack(&mint_info.data.borrow()).is_ok()
    };

    Ok(is_valid)
}

// Validates that a mint account's owning program is the expected program
pub fn is_token_program_valid_for_mint(
    mint_info: &AccountInfo,
    expected_program: &Pubkey,
) -> Result<bool, ProgramError> {
    match expected_program {
        id if *id == spl_token::id() || *id == spl_token_2022::id() => {
            Ok(mint_info.owner == expected_program)
        }
        _ => Err(ProgramError::InvalidArgument),
    }
}

pub fn is_valid_token_account(
    account: &AccountInfo,
    owner: &Pubkey,
    mint: &Pubkey,
) -> Result<bool, ProgramError> {
    // Check program owner first
    if account.owner == &spl_token::id() {
        let account_data = spl_token::state::Account::unpack(&account.data.borrow())?;
        Ok(account_data.owner == *owner && account_data.mint == *mint)
    } else if account.owner == &spl_token_2022::id() {
        let account_data = spl_token_2022::state::Account::unpack(&account.data.borrow())?;
        Ok(account_data.owner == *owner && account_data.mint == *mint)
    } else {
        Err(ProgramError::InvalidArgument)
    }
}
