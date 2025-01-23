use solana_program::{account_info::AccountInfo, program_error::ProgramError, program_pack::Pack};

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
