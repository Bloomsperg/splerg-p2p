use solana_program::program_error::ProgramError;

#[derive(Debug, PartialEq)]
pub enum SwapError {
    InvalidInstruction,
    OrderAlreadyInitialized,
    TakerAlreadyAssigned,
    MakerTokensNotDeposited,
    UnauthorizedSigner,
    InvalidOrderState,
    InvalidMint,
    InvalidAmount,
    InvalidTokenProgram,
    InvalidTokenAccount,
    InsufficientFunds,
    Overflow,
    InvalidDecimals,
}

impl From<SwapError> for ProgramError {
    fn from(e: SwapError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
