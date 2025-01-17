import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../wba-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {

    let tx = createNft(umi, {
        mint: mint,
        uri: "https://devnet.irys.xyz/HiNAT7vHuwAE9YSCVoDspAMXFj3zGQTL9cFFWXNYnAho",
        sellerFeeBasisPoints: percentAmount(100, 2),
        name: "SuperRug",
        symbol: "SRUG",
    });
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);
    
    console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)

    console.log("Mint Address: ", mint.publicKey);

    // https://explorer.solana.com/tx/4fFKqKSpx8QqbviGNB1msSjNiBb35bpwGzFUM5kokoyxKarAB5axFCa674jk9svb1NqLdZwnYjL9xttzCMrTuYHs?cluster=devnet
    // Mint Address:  34mFkSzxMGZBgM4N7553euEmrfRCD8NY1Z8tm77neASf
})();
