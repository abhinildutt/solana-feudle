use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    declare_id, entrypoint, entrypoint::ProgramResult,
    msg, program_error::ProgramError, pubkey::Pubkey,
};

declare_id!("Fg6PaF8sFnS8knuVQrCME6mmMm1KPvvnD6BrGvreeArT");

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
    player1_pubkey: Pubkey,
    player2_pubkey: Pubkey,
    // Storing guesses as Vec<u8>, representing hashed or encoded strings for simplicity
    player1_guesses: Vec<Vec<u8>>,
    player2_guesses: Vec<Vec<u8>>,
    solution: Vec<u8>, // Solution also stored in a similar hashed or encoded format
    game_status: i8, // -1: Continue, 0: Tie, 1: Player 1 wins, 2: Player 2 wins
}

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8], // Expecting a player index followed by a guess hash
) -> ProgramResult {
    msg!("Game program entry point");

    // Instruction data parsing is simplified for demonstration
    if instruction_data.len() < 33 { // 1 byte for player index + 32 bytes for guess hash
        return Err(ProgramError::InvalidInstructionData);
    }

    let player_index = instruction_data[0];
    let guess_hash = &instruction_data[1..33]; // Simplified, assuming hash length of 32 bytes

    let accounts_iter = &mut accounts.iter();
    let game_state_account = next_account_info(accounts_iter)?;

    if !game_state_account.is_writable {
        return Err(ProgramError::InvalidAccountData);
    }

    let mut game_state: GameState = match GameState::try_from_slice(&game_state_account.data.borrow()) {
        Ok(data) => data,
        Err(_) => return Err(ProgramError::InvalidAccountData),
    };

    match player_index {
        0 => game_state.player1_guesses.push(guess_hash.to_vec()),
        1 => game_state.player2_guesses.push(guess_hash.to_vec()),
        _ => return Err(ProgramError::InvalidInstructionData),
    }

    // Example logic for updating game status based on the new guess
    // This is highly simplified and does not represent actual game logic
    game_state.game_status = evaluate_game_status(&game_state);

    game_state.serialize(&mut *game_state_account.data.borrow_mut())?;

    msg!("Game state updated");

    Ok(())
}

fn evaluate_game_status(game_state: &GameState) -> i8 {
     // Check if player 1 has guessed correctly
     let player1_correct = game_state.player1_guesses.iter().any(|guess| *guess == game_state.solution);
    
     // Check if player 2 has guessed correctly
     let player2_correct = game_state.player2_guesses.iter().any(|guess| *guess == game_state.solution);
     
     // Determine game status based on guesses
     match (player1_correct, player2_correct) {
         (true, false) => 1, // Player 1 wins
         (false, true) => 2, // Player 2 wins
         (true, true) => 0,  // Tie
         _ => -1,            // Continue the game
     }
}
