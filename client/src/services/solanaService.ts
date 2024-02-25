import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  Keypair, 
  sendAndConfirmTransaction, 
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  AccountInfo,
  Context
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import * as borsh from 'borsh';

export const SOLANA_NETWORK = "http://127.0.0.1:8899";

window.Buffer = window.Buffer || Buffer;

export const sendGuess = async (
  gameStateAccountPubkey: string, 
  programId: string, 
  guess: string, 
  playerIndex: number,
  player1Pubkey: string,
  player2Pubkey: string
) => {
  console.log("game state pubkey : ", gameStateAccountPubkey);
  const connection = new Connection(SOLANA_NETWORK, "confirmed");
  const programPublicKey = new PublicKey(programId);
  const gameStatePublicKey = new PublicKey(gameStateAccountPubkey);
  const player1PublicKey = new PublicKey(player1Pubkey);
  const player2PublicKey = new PublicKey(player2Pubkey);
  // Generate a new burner wallet (keypair)
  const burnerWallet = Keypair.generate();

  // Airdrop SOL to the burner wallet for account creation fees
  const airdropSignature = await connection.requestAirdrop(
    burnerWallet.publicKey,
    1 * LAMPORTS_PER_SOL // Adjust the amount of SOL airdropped as needed
  );
  // Wait for the airdrop to be confirmed
  await connection.confirmTransaction(airdropSignature, 'confirmed');

  // Assume guess is processed (e.g., hashed or encoded) before being sent
  const processedGuess = new TextEncoder().encode(guess);

  let data = new Uint8Array(2 + processedGuess.length);
  
  data[0] = 1; // Instruction for making a guess
  data[1] = playerIndex; // Player index
  data.set(processedGuess, 2); // Append guess after the first 2 bytes

  const bufferData = Buffer.from(data);

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: gameStatePublicKey, isSigner: false, isWritable: true },
      { pubkey: player1PublicKey, isSigner: false, isWritable: false },
      { pubkey: player2PublicKey, isSigner: false, isWritable: false }
    ],
    programId: programPublicKey,
    data: bufferData,
  });

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = burnerWallet.publicKey;

  // Sign the transaction with the burner wallet
  transaction.sign(burnerWallet); // Here, the transaction is signed directly with the burner wallet's private key

  // Send the signed transaction
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  console.log('Done sending guess : ', signature);
};

export const initializeGame = async (
  gameStateAccountPubkey: string,
  programId: string,
  player1Pubkey: string,
  player2Pubkey: string
): Promise<void> => {
  const connection = new Connection(SOLANA_NETWORK, "confirmed");

  // Generate a new burner wallet (keypair)
  const burnerWallet = Keypair.generate();

  // Airdrop SOL to the burner wallet for account creation fees
  const airdropSignature = await connection.requestAirdrop(
    burnerWallet.publicKey,
    1 * LAMPORTS_PER_SOL // Adjust the amount of SOL airdropped as needed
  );
  // Wait for the airdrop to be confirmed
  await connection.confirmTransaction(airdropSignature, 'confirmed');

  const programPublicKey = new PublicKey(programId);
  const gameStatePublicKey = new PublicKey(gameStateAccountPubkey);
  const player1PublicKey = new PublicKey(player1Pubkey);
  const player2PublicKey = new PublicKey(player2Pubkey);

  // Creating the instruction for initializing the game
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: gameStatePublicKey, isSigner: false, isWritable: true },
      { pubkey: player1PublicKey, isSigner: false, isWritable: false },
      { pubkey: player2PublicKey, isSigner: false, isWritable: false }
    ],
    programId: programPublicKey,
    data: Buffer.from([0, 0, 0]), // Assuming 0 is the instruction for initializing the game
  });

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = burnerWallet.publicKey;

  // Signing the transaction with the burner wallet
  transaction.sign(burnerWallet);

  // Send the raw transaction
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  
  console.log("Done initializing : ", signature)
};

export class GameState {
  player1: string = '';
  player2: string = '';
  player1_guess: string = '';
  player2_guess: string = '';
  solution: string = '';
  game_status: number = 0; // Assuming i8 maps to number in TypeScript for your use case

  constructor(fields: { player1: string, player2: string, player1_guess: string, player2_guess: string, solution: string, game_status: number } | undefined = undefined) {
    if (fields) {
      this.player1 = fields.player1;
      this.player2 = fields.player2;
      this.player1_guess = fields.player1_guess;
      this.player2_guess = fields.player2_guess;
      this.solution = fields.solution;
      this.game_status = fields.game_status;
    }
  }
}
export class GameStateSchema {
  static schema = new Map([
    [GameState, { kind: 'struct', fields: [
      ['player1', 'string'],
      ['player2', 'string'],
      ['player1_guess', 'string'],
      ['player2_guess', 'string'],
      ['solution', 'string'],
      ['game_status', 'u8'],
    ]}],
  ]);
}

export const fetchGameState = async (
  gameStateAccountPubkey: string
): Promise<GameState | null> => {
  const connection = new Connection(SOLANA_NETWORK, "confirmed");
  const gameStatePublicKey = new PublicKey(gameStateAccountPubkey);

  try {
    const accountInfo = await connection.getAccountInfo(gameStatePublicKey);
    if (accountInfo === null) {
      console.log('Game state account not found.');
      return null;
    }

    const trimmedData = accountInfo.data.slice(0, 124);

    // Assuming the game state data is stored in the account's data field
    const gameState: GameState = borsh.deserialize(
      GameStateSchema.schema,
      GameState,
      trimmedData
    );

    console.log('Fetched game state:', gameState);
    return gameState;
  } catch (error) {
    console.error('Failed to fetch game state:', error);
    return null;
  }
};

const onGameStateChange = (game_key: string) => async (accountInfo: AccountInfo<Buffer>, context: Context) => {
  try {
    const gameState = await fetchGameState(game_key); // Assuming fetchGameState now takes game_key as argument

    // Here, update your UI or state with the fetched gameState
  } catch (error) {
    console.error('Failed to fetch game state:', error);
  }
};

// Subscribe to account changes
export const subscribeToGameStateChanges = async (game_key : string) => {
  const connection = new Connection(SOLANA_NETWORK, "confirmed");
  connection.onAccountChange(new PublicKey(game_key), onGameStateChange(game_key), 'confirmed');
};