use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Make<'info> {
    #[account(mut)]
    maker: Signer<'info>,
    // #[account(mut)]
    // maker: Account<'info>,
}
