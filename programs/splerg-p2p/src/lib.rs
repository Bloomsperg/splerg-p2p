#![allow(unexpected_cfgs)]

pub mod error;
pub mod instruction;
pub mod math;
pub mod processor;
pub mod state;
pub mod validation;

pub mod splerg_p2p {
    use crate::processor::Processor;

    use solana_program::{
        account_info::AccountInfo, declare_id, entrypoint, entrypoint::ProgramResult,
        pubkey::Pubkey,
    };

    declare_id!("GKTd9AGFpPGNKK28ncHeGGuT7rBJLzPxNjCUPKn8Yik8");

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
