import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({address: "https://devnet.irys.xyz/",}));
umi.use(signerIdentity(signer));

(async () => {
    try {
        // 1. Load image
        // 2. Convert image to generic file.
        // 3. Upload image
        const fileName = "./cluster1/generug.png";
        const image = await readFile(fileName);
        const genericFile = createGenericFile(image, "genrug.png", 
            {
                contentType: "image/png"
            });
        const [myUri] = await umi.uploader.upload([genericFile]);
        console.log("Your image URI: ", myUri);
        //  https://devnet.irys.xyz/F6ocN9ggUK7H42N6BvVF1bfyGVasZRLGeemtZVVbBKkq
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
