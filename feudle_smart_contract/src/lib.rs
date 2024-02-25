use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint, entrypoint::ProgramResult,
    msg, program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
    pub player1: String,
    pub player2: String,
    pub player1_guess: String,
    pub player2_guess: String,
    pub solution: String,
    pub game_status: i8, // -1: Continue, 0: Tie, 1: Player 1 wins, 2: Player 2 wins
}

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let game_account = next_account_info(accounts_iter)?;
    
    let instruction: u8 = instruction_data[0].into();
    let played_by: u8 = instruction_data[1].into();
    let result = std::str::from_utf8(&instruction_data[2..]); // Adjust slice as needed

    match result {
        Ok(player_guess) => {
            match instruction {
                // Assuming instruction 0 is to create a new game
                0 => {
                    msg!("Making a new game");
                    let mut game_data = GameState {
                        player1: accounts[1].key.to_string(),
                        player2: accounts[2].key.to_string(),
                        player1_guess: "inval".to_string(),
                        player2_guess: "inval".to_string(),
                        solution: "chore".to_string(), // Example solution, this should be set appropriately
                        game_status: -1, // Game continues
                    };
                    game_data.serialize(&mut &mut game_account.data.borrow_mut()[..])?;
                },
                // Assuming instruction 1 is for making a guess
                1 => {
                    msg!("Processing a guess");
                    // let mut game_data: GameState = GameState::try_from_slice(&game_account.data.borrow())?;
                    let mut game_data = GameState {
                        player1: accounts[1].key.to_string(),
                        player2: accounts[2].key.to_string(),
                        player1_guess: "inval".to_string(),
                        player2_guess: "inval".to_string(),
                        solution: "chore".to_string(), // Example solution, this should be set appropriately
                        game_status: -1, // Game continues
                    };
                    
                    if played_by == 1 {
                        game_data.player1_guess = player_guess.to_string();
                    } else if played_by == 2 {
                        game_data.player2_guess = player_guess.to_string();
                    } else {
                        return Err(ProgramError::InvalidArgument);
                    }

                    // Here you would add logic to update the game status based on the guess
                    // For example, checking if the guess matches the solution
                    
                    game_data.serialize(&mut &mut game_account.data.borrow_mut()[..])?;
                },
                // Handle other instructions or invalid instruction
                _ => return Err(ProgramError::InvalidInstructionData),
            }
            Ok(())
        },
        Err(_) => Err(ProgramError::InvalidInstructionData),
    }
}
