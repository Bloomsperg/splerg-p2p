use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct SwapOrder {
    pub is_initialized: bool,
    pub maker: Pubkey,
    pub taker: Option<Pubkey>,
    pub maker_token_mint: Pubkey,
    pub taker_token_mint: Pubkey,
    pub maker_amount: u64,
    pub taker_amount: u64,
    pub maker_token_account: Pubkey,
    pub taker_token_account: Option<Pubkey>,
    pub state: OrderState,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq, Clone)]
pub enum OrderState {
    Created,
    TakerAssigned,
    MakerDeposited,
    Completed,
}

impl SwapOrder {
    pub const LEN: usize = 1 + // is_initialized
        32 + // maker
        33 + // taker (Option<Pubkey>)
        32 + // maker_token_mint
        32 + // taker_token_mint
        8 + // maker_amount
        8 + // taker_amount
        32 + // maker_token_account
        33 + // taker_token_account (Option<Pubkey>)
        1; // state (enum)

    pub fn new(
        maker: Pubkey,
        maker_token_mint: Pubkey,
        taker_token_mint: Pubkey,
        maker_amount: u64,
        taker_amount: u64,
        maker_token_account: Pubkey,
    ) -> Self {
        Self {
            is_initialized: true,
            maker,
            taker: None,
            maker_token_mint,
            taker_token_mint,
            maker_amount,
            taker_amount,
            maker_token_account,
            taker_token_account: None,
            state: OrderState::Created,
        }
    }
}
