use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum SwapInstruction {
    /// Initialize P2P swap order
    /// Accounts:
    /// * [signer] Maker (order creator, pays rent)
    /// * [writable] Order PDA account (to be created)
    /// * [] Maker token mint
    /// * [] Taker token mint
    /// * [] System program
    /// * [] Rent sysvar
    InitializeOrder {
        maker_amount: u64,
        taker_amount: u64,
    },

    /// Deposit maker's tokens into escrow
    /// Accounts:
    /// * [signer] Maker
    /// * [writable] Order PDA account
    /// * [writable] Maker's token account (source)
    /// * [writable] Program's escrow token account
    /// * [] Token program
    /// * [] Token Authority PDA
    DepositMakerTokens,

    /// Assign taker to swap order
    /// Accounts:
    /// * [signer] Taker
    /// * [writable] Order PDA account
    /// * [writable] Taker's token account
    AssignTaker,

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
