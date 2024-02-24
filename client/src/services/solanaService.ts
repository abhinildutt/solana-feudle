import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  Keypair, 
  sendAndConfirmTransaction 
} from '@solana/web3.js';

const SOLANA_NETWORK = "https://api.testnet.solana.com";

export const sendGuess = async (
  gameStateAccountPubkey: string, 
  programId: string, 
  guess: string, 
  playerIndex: number
) => {
  const connection = new Connection(SOLANA_NETWORK, "confirmed");
  const programPublicKey = new PublicKey(programId);
  const gameStatePublicKey = new PublicKey(gameStateAccountPubkey);

  // Generate a new burner wallet (keypair)
  const burnerWallet = Keypair.generate();

  // Assume guess is processed (e.g., hashed or encoded) before being sent
  const processedGuess = new TextEncoder().encode(guess);

  const instruction = new TransactionInstruction({
      keys: [{ pubkey: gameStatePublicKey, isSigner: false, isWritable: true }],
      programId: programPublicKey,
      data: Buffer.from([playerIndex, ...processedGuess]),
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

  console.log('Transaction signature', signature);
};
