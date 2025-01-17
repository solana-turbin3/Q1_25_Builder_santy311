import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({address: "https://devnet.irys.xyz/",}));
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://devnet.irys.xyz/4Vfm3PcaP4bUTjLp6pfYBW7wkd7HD3QHV2euUibSQCZg";
        const metadata = {
            name: "SuperRug",
            symbol: "SRUG",
            description: "This is the best RUG you have been pulled on",
            image: image,
            attributes: [
                {
                    trait_type: 'color', value: 'blue',
                }
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: image
                    },
                ]
            },
            creators: []
        };
        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Your metadata URI: ", myUri);

        // https://arweave.net/DEwM7crYyNWn8GVr3YVPnndwdgEY8MC69J4mih4frP5z
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
