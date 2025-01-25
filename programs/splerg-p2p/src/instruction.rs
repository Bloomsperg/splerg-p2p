use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum SwapInstruction {
    /// Initialize P2P swap order
    /// Accounts:
    /// * [signer] Maker (order creator, pays rent)
    /// * [writable] Order PDA account (to be created)
    /// * [writable] Maker mint ATA (initialized)
    /// * [writable] PDA ATA (initialized)
    /// * [] Taker (order counterparty)
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
    /// * [] Token program
    /// * [] Token Authority PDA
    CompleteSwap,

    /// Close order and reclaim rent
    /// Accounts:
    /// * [signer] Order authority (maker if incomplete, either party if complete)
    /// * [writable] Order PDA account
    /// * [writable] Rent receiver
    /// * [writable, optional] Program's escrow token account
    /// * [writable, optional] Maker's token account (refund)
    /// * [optional] Token program
    /// * [optional] Token Authority PDA
    CloseOrder,
}
