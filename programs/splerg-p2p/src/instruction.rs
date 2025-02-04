use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum SwapInstruction {
    /// Initialize Treasury
    /// Accounts:
    /// * [signer] Payer
    /// * [writable] Treasury PDA account
    /// * [] Authority
    /// * [] System program
    /// * [] Rent sysvar
    InitializeTreasury { authority: [u8; 32], fee: u16 },

    /// Update Treasury Authority
    /// Accounts:
    /// * [signer] Authority
    /// * [writable] Treasury PDA account
    /// * [] Authority
    UpdateTreasuryAuthority { authority: [u8; 32], fee: u16 },

    /// Harvest Treasury
    /// Accounts:
    /// * [signer] Authority
    /// * [writable] treasury_token_account
    /// * [writable] Treasury PDA account
    /// * [writable] receiver_token_account
    /// * [] Mint
    /// * [] Token program
    Harvest,

    /// Initialize P2P swap order
    /// Accounts:
    /// * [signer] Maker (order creator, pays rent)
    /// * [writable] Order PDA account (to be created)
    /// * [writable] Maker mint ATA (initialized)
    /// * [writable] PDA maker mint ATA (initialized)
    /// * [] Maker token mint
    /// * [] Taker token mint
    /// * [] System program
    /// * [] Rent sysvar
    /// * [] Token Program (optional Token 2022)
    InitializeOrder {
        maker_amount: u64,
        taker_amount: u64,
    },

    /// Change order amounts
    /// Accounts:
    /// * [signer] Maker
    /// * [writable] Order PDA account
    /// * [writable] Program's escrow token account
    /// * [writable] Maker's token account
    /// * [] Mint info
    /// * [] Token program
    ChangeOrderAmounts {
        new_maker_amount: u64,
        new_taker_amount: u64,
    },

    /// Change order taker
    /// Accounts:
    /// * [signer] Maker
    /// * [writable] Order PDA account
    /// * [] New taker pubkey
    ChangeTaker { new_taker: [u8; 32] },

    /// Complete swap
    /// Accounts:
    /// * [signer] Taker
    /// * [writable] Order PDA account
    /// * [writable] Maker's receiving token account
    /// * [writable] Taker's sending token account
    /// * [writable] Taker's receiving token account
    /// * [writable] Program's escrow token account
    /// * [] Maker mint
    /// * [] Taker mint
    /// * [] Token program
    /// * [] Token Authority PDA
    CompleteSwap,

    /// Close order and reclaim rent
    /// Accounts:
    /// * [signer] Order authority (maker if incomplete, either party if complete)
    /// * [writable] Order PDA account
    CloseOrder,
}
