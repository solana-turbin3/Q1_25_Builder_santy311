//! Payment instruction handler for the Anchor Vault program
//!
//! This module contains the logic for depositing SOL into and withdrawing SOL from
//! the vault. Deposits transfer SOL from the user to the vault PDA, while
//! withdrawals transfer SOL from the vault PDA back to the user.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::state::vault_state::VaultState;

/// Accounts required for deposit and withdraw instructions
#[derive(Accounts)]
pub struct Payment<'info> {
    /// The user performing the deposit or withdrawal
    #[account(mut)]
    pub user: Signer<'info>,

    /// The vault account that holds the SOL
    /// This is a PDA derived from ["vault", user_pubkey]
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    /// The vault state account containing the vault's metadata
    /// This is a PDA derived from ["state", user_pubkey]
    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    /// Required by the runtime for SOL transfers
    pub system_program: Program<'info, System>,
}

impl<'info> Payment<'info> {
    /// Deposits SOL from the user's wallet into the vault
    ///
    /// # Arguments
    ///
    /// * `amount` - Amount of lamports to deposit
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Result indicating success or failure
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_tx = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_tx, amount)?;

        Ok(())
    }

    /// Withdraws SOL from the vault back to the user's wallet
    /// Requires a PDA signature since the vault is transferring funds
    ///
    /// # Arguments
    ///
    /// * `amount` - Amount of lamports to withdraw
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Result indicating success or failure
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
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

        transfer(cpi_tx, amount)?;

        Ok(())
    }
}
