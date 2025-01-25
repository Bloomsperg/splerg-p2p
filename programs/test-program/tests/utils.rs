use std::{fs, path::PathBuf};

pub fn load_program(program_name: &str) -> String {
    PathBuf::from("../../target")
        .join("deploy")
        .join(program_name)
        .to_str()
        .unwrap()
        .to_string()
}
