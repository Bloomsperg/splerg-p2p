use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq, Clone)]
pub enum OrderState {
    Created,
    TakerAssigned,
    MakerDeposited,
    Completed,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct SwapOrder {
    pub maker: Pubkey,
    pub taker: Option<Pubkey>,
    pub maker_token_mint: Pubkey,
    pub taker_token_mint: Pubkey,
    pub maker_amount: u64,
    pub taker_amount: u64,
    pub state: OrderState,
}

impl SwapOrder {
    pub const LEN: usize = 32 + // maker
        33 + // taker (Option<Pubkey>)
        32 + // maker_token_mint
        32 + // taker_token_mint
        8 + // maker_amount
        8 + // taker_amount
        1; // state (enum)

    pub fn new(
        maker: Pubkey,
        maker_token_mint: Pubkey,
        taker_token_mint: Pubkey,
        maker_amount: u64,
        taker_amount: u64,
    ) -> Self {
        Self {
            maker,
            taker: None,
            maker_token_mint,
            taker_token_mint,
            maker_amount,
            taker_amount,
            state: OrderState::Created,
        }
    }
}
