use borsh::{BorshDeserialize, BorshSerialize};
use shank::ShankInstruction;

#[derive(BorshSerialize, ShankInstruction, BorshDeserialize, Debug)]
pub enum SwapInstruction {
    #[account(0, signer, name = "payer", desc = "Payer account")]
    #[account(1, writable, name = "treasury", desc = "Treasury PDA account")]
    #[account(2, name = "authority", desc = "Authority account")]
    #[account(3, name = "system_program", desc = "System program")]
    #[account(4, name = "rent", desc = "Rent sysvar")]
    InitializeTreasury { authority: [u8; 32], fee: u16 },

    #[account(0, signer, name = "authority", desc = "Authority account")]
    #[account(1, writable, name = "treasury", desc = "Treasury PDA account")]
    #[account(2, name = "new_authority", desc = "New authority account")]
    UpdateTreasuryAuthority { authority: [u8; 32], fee: u16 },

    #[account(0, signer, name = "authority", desc = "Authority account")]
    #[account(
        1,
        writable,
        name = "treasury_token_account",
        desc = "Treasury token account"
    )]
    #[account(2, writable, name = "treasury", desc = "Treasury PDA account")]
    #[account(
        3,
        writable,
        name = "receiver_token_account",
        desc = "Receiver token account"
    )]
    #[account(4, name = "mint", desc = "Mint account")]
    #[account(5, name = "token_program", desc = "Token program")]
    Harvest,

    #[account(0, signer, name = "maker", desc = "Maker (order creator, pays rent)")]
    #[account(
        1,
        writable,
        name = "order",
        desc = "Order PDA account (to be created)"
    )]
    #[account(2, writable, name = "maker_ata", desc = "Maker mint ATA (initialized)")]
    #[account(
        3,
        writable,
        name = "pda_maker_ata",
        desc = "PDA maker mint ATA (initialized)"
    )]
    #[account(4, name = "maker_mint", desc = "Maker token mint")]
    #[account(5, name = "taker_mint", desc = "Taker token mint")]
    #[account(6, name = "system_program", desc = "System program")]
    #[account(7, name = "rent", desc = "Rent sysvar")]
    #[account(
        8,
        name = "token_program",
        desc = "Token Program (optional Token 2022)"
    )]
    InitializeOrder {
        maker_amount: u64,
        taker_amount: u64,
    },

    #[account(0, signer, name = "maker", desc = "Maker account")]
    #[account(1, writable, name = "order", desc = "Order PDA account")]
    #[account(
        2,
        writable,
        name = "escrow_token_account",
        desc = "Program's escrow token account"
    )]
    #[account(
        3,
        writable,
        name = "maker_token_account",
        desc = "Maker's token account"
    )]
    #[account(4, name = "mint", desc = "Mint info")]
    #[account(5, name = "token_program", desc = "Token program")]
    ChangeOrderAmounts {
        new_maker_amount: u64,
        new_taker_amount: u64,
    },

    #[account(0, signer, name = "maker", desc = "Maker account")]
    #[account(1, writable, name = "order", desc = "Order PDA account")]
    #[account(2, name = "new_taker", desc = "New taker pubkey")]
    ChangeTaker { new_taker: [u8; 32] },

    #[account(0, signer, name = "taker", desc = "Taker account")]
    #[account(1, writable, name = "order", desc = "Order PDA account")]
    #[account(
        2,
        writable,
        name = "maker_receiving_account",
        desc = "Maker's receiving token account"
    )]
    #[account(
        3,
        writable,
        name = "taker_sending_account",
        desc = "Taker's sending token account"
    )]
    #[account(
        4,
        writable,
        name = "taker_receiving_account",
        desc = "Taker's receiving token account"
    )]
    #[account(
        5,
        writable,
        name = "escrow_token_account",
        desc = "Program's escrow token account"
    )]
    #[account(6, name = "maker_mint", desc = "Maker mint")]
    #[account(7, name = "taker_mint", desc = "Taker mint")]
    #[account(8, name = "token_program", desc = "Token program")]
    #[account(9, name = "token_authority", desc = "Token Authority PDA")]
    CompleteSwap,

    #[account(
        0,
        signer,
        name = "authority",
        desc = "Order authority (maker if incomplete, either party if complete)"
    )]
    #[account(1, writable, name = "order", desc = "Order PDA account")]
    CloseOrder,
}
