import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("anchor_vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnchorVault as Program<AnchorVault>;
  const provider = anchor.getProvider();
  const user = provider.publicKey;

  // Derive PDAs for vault and vault state
  const [vaultState] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), user.toBuffer()],
    program.programId
  );
  
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), user.toBuffer()],
    program.programId
  );

  it("Initializes a new vault", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        user: user,
      })
      .rpc();

    // Verify the vault state account was created
    const vaultStateAccount = await program.account.vaultState.fetch(vaultState);
    assert(vaultStateAccount !== null);
  });

  it("Can deposit SOL into the vault", async () => {
    const depositAmount = new anchor.BN(2_000_000_000); // 2 SOL
    const vaultBalanceBefore = await provider.connection.getBalance(vault);

    await program.methods
      .deposit(depositAmount)
      .accounts({
        user: user,
      })
      .rpc();

    const vaultBalanceAfter = await provider.connection.getBalance(vault);
    assert.equal(
      vaultBalanceAfter - vaultBalanceBefore,
      depositAmount.toNumber(),
      "Deposit amount should match balance increase"
    );
  });

  it("Can withdraw SOL from the vault", async () => {
    const withdrawAmount = new anchor.BN(1_000_000_000); // 1 SOL
    const vaultBalanceBefore = await provider.connection.getBalance(vault);
    const userBalanceBefore = await provider.connection.getBalance(user);

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        user: user,
      })
      .rpc();

    const vaultBalanceAfter = await provider.connection.getBalance(vault);
    const userBalanceAfter = await provider.connection.getBalance(user);

    assert.approximately(
      vaultBalanceBefore - vaultBalanceAfter,
      withdrawAmount.toNumber(),
      1000000, // Allow for small difference due to transaction fees
      "Withdrawal amount should match vault balance decrease"
    );

    console.log("User balance before:", userBalanceBefore);
    console.log("User balance after:", userBalanceAfter);

    console.log("Vault balance before:", vaultBalanceBefore);
    console.log("Vault balance after:", vaultBalanceAfter);

    assert.approximately(
      userBalanceAfter - userBalanceBefore,
      withdrawAmount.toNumber(),
      1000000,
      "User balance should decrease by the withdrawal amount"
    );
  });

  it("Can close the vault", async () => {
    const vaultBalanceBefore = await provider.connection.getBalance(vault);
    const userBalanceBefore = await provider.connection.getBalance(user);

    console.log("User pubkey:", user.toBase58());
    console.log("Vault pubkey:", vault.toBase58());
    console.log("Vault state pubkey:", vaultState.toBase58());
    
    await program.methods
      .close()
      .accounts({
        user: user,
      })
      .rpc();

    // Verify vault is empty
    const vaultBalanceAfter = await provider.connection.getBalance(vault);
    assert.equal(vaultBalanceAfter, 0, "Vault should be empty after closing");

    // Verify user received the funds (approximately, accounting for tx fees)
    const userBalanceAfter = await provider.connection.getBalance(user);
    assert.approximately(
      userBalanceAfter - userBalanceBefore,
      vaultBalanceBefore,
      1000000, // Allow for small difference due to transaction fees
      "User should receive vault balance"
    );

    // Verify vault state account is closed
    try {
      await program.account.vaultState.fetch(vaultState);
      assert.fail("Vault state account should be closed");
    } catch (e) {
      // Expected error - account does not exist
    }
  });
});
