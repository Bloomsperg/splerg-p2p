use solana_program::program_error::ProgramError;

#[derive(Debug)]
pub enum SwapError {
    InvalidInstruction,
    OrderAlreadyInitialized,
    TakerAlreadyAssigned,
    MakerTokensNotDeposited,
    UnauthorizedSigner,
    InvalidOrderState,
    InvalidMint,
    InvalidAmount,
}

impl From<SwapError> for ProgramError {
    fn from(e: SwapError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
