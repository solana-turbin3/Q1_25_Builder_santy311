use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    seed: u64,
    maker: PubKey,
    mint_a: PubKey,
    mint_b: PubKey,
    bumps: u8,
}
