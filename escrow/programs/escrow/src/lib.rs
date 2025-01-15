use anchor_lang::prelude::*;

declare_id!("EHx6TTsGEME8iRoKuvW5TL66RrhcfWGaYtiXPveBTdxD");
mod context;
use context::*;

mod state;
use state::Escrow;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, amount: u64, receive: u64) -> Result<()> {
        ctx.accounts.save_escrow(seed, amount, ctx.bumps)?;
        ctx.accounts.deposit_to_vault(amount)?;
        Ok(())
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.transfer();
        ctx.accounts.withdraw_amd_close();
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.withdraw_and_close();
        Ok(())
    }
}
