//! Close instruction handler for the Anchor Vault program
//!
//! This module contains the logic for closing a vault. When a vault is closed,
//! all remaining SOL is transferred back to the user and the vault state account
//! is closed, returning its rent to the user.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::state::vault_state::VaultState;

/// Accounts required for the close instruction
#[derive(Accounts)]
pub struct Close<'info> {
    /// The user closing their vault
    #[account(mut)]
    pub user: Signer<'info>,

    /// The vault account holding the SOL to be returned
    /// This is a PDA derived from ["vault", vault_state_pubkey]
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    vault: SystemAccount<'info>,

    /// The vault state account to be closed
    /// This is a PDA derived from ["state", vault_state_pubkey]
    /// Will be closed and rent returned to user
    #[account(
        mut,
        close = user,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    /// Required by the runtime for SOL transfers
    pub system_program: Program<'info, System>,
}

impl<'info> Close<'info> {
    /// Closes the vault by transferring all remaining SOL to the user
    /// and closing the vault state account
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Result indicating success or failure
    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        let seeds = &[
            b"vault",
            self.user.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_tx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        let amount = self.vault.get_lamports();

        transfer(cpi_tx, amount)?;

        Ok(())
    }
}
