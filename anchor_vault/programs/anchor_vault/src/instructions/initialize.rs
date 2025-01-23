//! Initialize instruction handler for the Anchor Vault program
//!
//! This module contains the initialization logic for creating a new vault account
//! and its associated state account. The vault is a PDA that can hold SOL, while
//! the vault state stores metadata about the vault.

use anchor_lang::prelude::*;

use crate::state::vault_state::VaultState;

/// Accounts required for the initialize instruction
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The user initializing the vault
    #[account(mut)]
    pub user: Signer<'info>,
    /// The vault state account that stores metadata
    /// This is a PDA derived from ["state", user_pubkey]
    #[account(
        init,
        payer = user,
        seeds = [b"state", user.key().as_ref()],
        bump,
        space = VaultState::INIT_SPACE
    )]
    pub vault_state: Account<'info, VaultState>,
    /// The vault account that will hold SOL
    /// This is a PDA derived from ["vault", user_pubkey]
    #[account(
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    /// Required by the runtime for account initialization
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    /// Initializes a new vault by storing the PDA bumps in the vault state
    ///
    /// # Arguments
    ///
    /// * `bump` - Struct containing the PDA bumps for vault_state and vault accounts
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Result indicating success or failure
    pub fn initialize(&mut self, bump: &InitializeBumps) -> Result<()> {
        self.vault_state.state_bump = bump.vault_state;
        self.vault_state.vault_bump = bump.vault;
        Ok(())
    }
}
