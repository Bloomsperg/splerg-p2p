use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct SwapOrder {
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub maker_token_mint: Pubkey,
    pub taker_token_mint: Pubkey,
    pub maker_amount: u64,
    pub taker_amount: u64,
    pub bump: u8,
}

impl SwapOrder {
    pub const LEN: usize = 32 + // maker
        32 + // taker
        32 + // maker_token_mint
        32 + // taker_token_mint
        8 + // maker_amount
        8 + // taker_amount
        1; // bump

    pub fn new(
        maker: Pubkey,
        taker: Pubkey,
        maker_token_mint: Pubkey,
        taker_token_mint: Pubkey,
        maker_amount: u64,
        taker_amount: u64,
        bump: u8,
    ) -> Self {
        Self {
            maker,
            taker,
            maker_token_mint,
            taker_token_mint,
            maker_amount,
            taker_amount,
            bump,
        }
    }
}
