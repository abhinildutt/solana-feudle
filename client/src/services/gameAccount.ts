import {
Connection,
PublicKey,
Transaction,
SystemProgram,
LAMPORTS_PER_SOL,
Account,
clusterApiUrl,
} from '@solana/web3.js';
import { getPhantomWallet } from './phantomWallet'; // This should prompt the user for connecting their wallet
import { TransactionConfirmationStrategy, Commitment } from '@solana/web3.js';

export async function createGameDataAccount({
player1,
player2,
programId,
}: {
player1: string;
player2: string;
programId: string;
}): Promise<string> {
const wallet = getPhantomWallet();
if (!wallet) throw new Error("Phantom wallet not found");

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const player1PublicKey = new PublicKey(player1);
const player2PublicKey = new PublicKey(player2);
const programPublicKey = new PublicKey(programId);

const GAME_ACCOUNT_SECRET = `${player1.substring(0, 5)}${player2.substring(0, 5)}`;
const gameDataAccountPubkey = await PublicKey.createWithSeed(
    wallet.publicKey, // Use the user's public key
    GAME_ACCOUNT_SECRET,
    programPublicKey,
);

let gameDataAccount = await connection.getAccountInfo(gameDataAccountPubkey);

if (gameDataAccount === null) {
    const GAME_DATA_SIZE = 500; // Set the appropriate size for your game data account
    const lamports = await connection.getMinimumBalanceForRentExemption(GAME_DATA_SIZE);

    const transaction = new Transaction().add(
    SystemProgram.createAccountWithSeed({
        fromPubkey: wallet.publicKey,
        basePubkey: wallet.publicKey,
        seed: GAME_ACCOUNT_SECRET,
        newAccountPubkey: gameDataAccountPubkey,
        lamports,
        space: GAME_DATA_SIZE,
        programId: programPublicKey,
    }),
    );

    // Ask the Phantom wallet to sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    console.log(`Game data account public key: ${gameDataAccountPubkey.toBase58()}`);
}

return gameDataAccountPubkey.toBase58();
}
