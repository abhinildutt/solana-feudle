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
    onCreate, // Added onCreate callback in the function parameters
}: {
    player1: string;
    player2: string;
    programId: string;
    onCreate: (gameDataAccountPubkey: string) => void; // Define the expected type of onCreate callback
}): Promise<string> {
    const connection = new Connection('http://127.0.0.1:8899', "confirmed");
    const burnerWallet = Keypair.generate();

    // Airdrop SOL to the burner wallet for account creation fees
    const airdropSignature = await connection.requestAirdrop(
        burnerWallet.publicKey,
        LAMPORTS_PER_SOL // Adjust the amount of SOL airdropped as needed
    );
    await connection.confirmTransaction(airdropSignature, 'confirmed');

    const airdropStatus = await connection.getSignatureStatus(airdropSignature);
    console.log("Airdrop status:", airdropStatus)

    const player1PublicKey = new PublicKey(player1);
    const player2PublicKey = new PublicKey(player2);
    const programPublicKey = new PublicKey(programId);

    const GAME_ACCOUNT_SECRET = `${player1.substring(0, 5)}${player2.substring(0, 5)}`;
    const gameDataAccountPubkey = await PublicKey.createWithSeed(
        burnerWallet.publicKey,
        GAME_ACCOUNT_SECRET,
        programPublicKey,
    );

    let gameDataAccount = await connection.getAccountInfo(gameDataAccountPubkey);

    if (gameDataAccount === null) {
        const GAME_DATA_SIZE = 500; // Appropriate size for your game data account
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

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = burnerWallet.publicKey;
        transaction.sign(burnerWallet); // Sign the transaction with the burner wallet

        // Send the transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`Game data account public key: ${gameDataAccountPubkey.toBase58()}`);
        onCreate(gameDataAccountPubkey.toBase58()); // Invoke the onCreate callback with the public key of the created account
    }

    return gameDataAccountPubkey.toBase58();
}
