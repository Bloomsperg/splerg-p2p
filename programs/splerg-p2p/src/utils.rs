use solana_program::{account_info::AccountInfo, program_error::ProgramError, program_pack::Pack};

pub fn get_mint_decimals(mint_account: &AccountInfo) -> Result<u8, ProgramError> {
    spl_token::state::Mint::unpack(&mint_account.data.borrow())
        .map(|mint| mint.decimals)
        .or_else(|_| {
            spl_token_2022::state::Mint::unpack(&mint_account.data.borrow())
                .map(|mint| mint.decimals)
        })
}
