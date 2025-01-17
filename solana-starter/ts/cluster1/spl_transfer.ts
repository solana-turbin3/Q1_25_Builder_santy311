import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../wba-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("3FbcG1XkdTbJHfpNGZJdLGVPDbJRqdkp7c2YqHLALEqy");

// Recipient address
const to = new PublicKey("4xn8H7RSXM64qSkjWMhjaKbEPS64pw7VGVgcXNc79jZr");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        console.log(`Sending from Wallet (ata): ${fromWallet.address.toBase58()}`);

        // Get the token account of the toWallet address, and if it does not exist, create it
        let toWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, to);
        console.log(`Sending to Wallet (ata): ${to.toBase58()}`);

        // Transfer the new token to the "toTokenAccount" we just created
        let tx = transfer(connection, keypair, fromWallet.address, toWallet.address, keypair, 1);
        console.log("tx: ", tx);
        
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();