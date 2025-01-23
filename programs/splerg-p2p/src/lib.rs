#![allow(unexpected_cfgs)]
use solana_program::declare_id;

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;
pub mod validation;

declare_id!("L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95");
pub mod spl_p2p {
    use crate::processor::Processor;

    use solana_program::{
        account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
    };

    #[cfg(not(feature = "no-entrypoint"))]
    entrypoint!(process_instruction);

    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        Processor::process(program_id, accounts, instruction_data)
    }
}
