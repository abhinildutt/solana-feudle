import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export async function createGameDataAccount({
    player1,
    player2,
    programId,
}: {
    player1: string;
    player2: string;
    programId: string;
}): Promise<string> {
    const connection = new Connection(clusterApiUrl('testnet'), 'confirmed');

    // Generate a new burner wallet (keypair)
    const burnerWallet = Keypair.generate();

    // For test purposes, you might need to airdrop some SOL to the burner wallet
    const airdropSignature = await connection.requestAirdrop(
        burnerWallet.publicKey,
        LAMPORTS_PER_SOL // Airdrop 1 SOL (adjust as needed for account creation fees)
    );
    // Confirm the airdrop transaction
    await connection.confirmTransaction(airdropSignature, 'confirmed');

    const player1PublicKey = new PublicKey(player1);
    const player2PublicKey = new PublicKey(player2);
    const programPublicKey = new PublicKey(programId);

    const GAME_ACCOUNT_SECRET = `${player1.substring(0, 5)}${player2.substring(0, 5)}`;
    const gameDataAccountPubkey = await PublicKey.createWithSeed(
        burnerWallet.publicKey, // Use the burner wallet's public key
        GAME_ACCOUNT_SECRET,
        programPublicKey,
    );

    let gameDataAccount = await connection.getAccountInfo(gameDataAccountPubkey);

    if (gameDataAccount === null) {
        const GAME_DATA_SIZE = 500; // Set the appropriate size for your game data account
        const lamports = await connection.getMinimumBalanceForRentExemption(GAME_DATA_SIZE);

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: burnerWallet.publicKey,
                basePubkey: burnerWallet.publicKey,
                seed: GAME_ACCOUNT_SECRET,
                newAccountPubkey: gameDataAccountPubkey,
                lamports,
                space: GAME_DATA_SIZE,
                programId: programPublicKey,
            }),
        );

        // Set the recentBlockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = burnerWallet.publicKey;

        // Sign the transaction with the burner wallet's private key
        transaction.sign(burnerWallet);

        // Send the transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`Game data account public key: ${gameDataAccountPubkey.toBase58()}`);
    }

    return gameDataAccountPubkey.toBase58();
}
