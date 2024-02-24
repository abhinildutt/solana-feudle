// // solanaService.ts or a similar file
// import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Signer, Commitment } from '@solana/web3.js';
// import { getPhantomWallet } from './phantomWallet'; // Assume this gets the user's Phantom wallet

// const SOLANA_NETWORK = "https://api.testnet.solana.com";

// export const sendGuess = async (gameStateAccountPubkey: string, programId: string, guess: string, playerIndex: number) => {
//   const wallet = getPhantomWallet();
//   if (!wallet) throw new Error("Phantom wallet not found");

//   const connection = new Connection(SOLANA_NETWORK, "confirmed");
//   const programPublicKey = new PublicKey(programId);
//   const gameStatePublicKey = new PublicKey(gameStateAccountPubkey);

//   // Assume guess is processed (e.g., hashed or encoded) before being sent
//   const processedGuess = new TextEncoder().encode(guess);

//   const instruction = new TransactionInstruction({
//     keys: [{ pubkey: gameStatePublicKey, isSigner: false, isWritable: true }],
//     programId: programPublicKey,
//     // Ensure the data format matches what your Solana program expects
//     // Here, it's simplified as [playerIndex, ...processedGuess]
//     data: Buffer.from([playerIndex, ...processedGuess]),
//   });

//   const transaction = new Transaction().add(instruction);
//   const { blockhash } = await connection.getLatestBlockhash();
//   transaction.recentBlockhash = blockhash;

//   // Set the transaction's fee payer
//   transaction.feePayer = wallet.publicKey;

//   const signers: Signer[] = []; // Empty if the transaction is already signed

//   const commitment: Commitment = "confirmed"; 
//   const options = {
//     commitment: commitment// Correct placement of the commitment option
//   };
//   // Ask the Phantom wallet to sign the transaction
//   const signedTransaction = await wallet.signTransaction(transaction);

//   // Send the signed transaction
//   const signature = await sendAndConfirmTransaction(connection, signedTransaction, signers, options);

//   console.log('Transaction signature', signature);
// };


// // GameAccount creation
