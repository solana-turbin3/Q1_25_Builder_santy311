# ARCHITECTURE

## POC requirements

The Protocol allows:

1. market creators to post prediction questions based on the available oracles
2. market creators put in initial liquidity in USDC tokens which will depsosited inside the pool
3. Liquidity Providers to deposit USDC as liquidity which will deposited inside the pool
4. Traders/Content consumers can buy the prediction(s) after the liquidity is provided and before the resolution
5. Traders/Content consumers can sell the prediction(s) after purchasing the prediction and before resolution.
6. Buying prediction will recieve yes/no SPL token to the traders/content consumers' token account
7. market creator can resolve the prediction after the resolution time

## Overview

```mermaid
classDiagram
    direction TB

    class Market {
        +creator: Pubkey
        +seed: u64
        +yes_mint: Pubkey
        +no_mint: Pubkey
        +description: String
        +frozen: bool
        +resolved: bool
        +outcome: Option~bool~
        +total_liquidity_shares: u64
        +fee_percentage: u16
        +market_bump: u8
        +yes_mint_bump: u8
        +no_mint_bump: u8
    }

    class MarketCreator {
        +Creates market
        +Provides initial liquidity
        +Resolves prediction
    }

    class LiquidityPool {
        +USDC tokens
        +Manages AMM
    }

    class LiquidityProvider {
        +Deposits USDC
        +Receives LP tokens
    }

    class Trader {
        +Buys predictions
        +Sells predictions
        +Holds Yes/No tokens
    }

    class TokenAccounts {
        +Yes SPL Token
        +No SPL Token
    }

    MarketCreator --* Market : Creates & Resolves
    Market --> LiquidityPool : Controls
    Market --> TokenAccounts : Controls mints
    LiquidityProvider --> LiquidityPool : Adds/Remove liquidity
    LiquidityPool --> TokenAccounts : Mints/Burns
    Trader --> LiquidityPool : Trades USDC
    Trader --> TokenAccounts : Receives/Sends
```

key components of the F4See prediction market architecture:

- Market Account: The central program containing all market parameters and state
- Market Creator: Creates markets, provides initial liquidity, and resolves predictions
- Liquidity Pool: Holds USDC tokens
- Liquidity Providers: Can deposit/withdraw additional USDC to increase market liquidity
- Traders: Can buy/sell predictions using USDC and receive Yes/No SPL tokens
- Token Accounts: Manages the Yes/No SPL tokens that represent predictions

### Create Market - SD

```mermaid
sequenceDiagram
    participant Creator as Market Creator
    participant Market as Market Account
    participant YMint as Yes Token Mint
    participant NMint as No Token Mint
    participant LP as Liquidity Pool
    participant YesPool as Yes Token Pool
    participant NoPool as No Token Pool

    Creator->>Market: Initialize Market Account With Liquidity
    Note over Market: Sets creator, description,<br/>fee percentage

    Creator->>LP: Deposit initial liquidity (USDC)

    Market->>YMint: Mint Yes Token Mint
    YMint ->> YesPool: Mint Token to YesPool
    Market->>NMint: Mint No Token Mint
    NMint ->> NoPool: Mint Token to No pool

    LP->>Market: Update total_liquidity_shares

    Note over Market: Market is now active<br/>and ready for trading

```

#### Market Creator initializes the Market Account with

- Market description
- Fee percentage
- Liquidity
- Yes Token Mint is created with Market as authority
- No Token Mint is created with Market as authority
- Initial USDC is deposited into Liquidity Pool
- Market's total_liquidity_shares is updated

### Provide Initial Liquidity

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant Market as Market Account
    participant LP_PDA as Liquidity Pool PDA
    participant YMint as Yes Token Mint
    participant NMint as No Token Mint

    LP->>Market: invoke addLiquidity

    Market->>Market: Calculate share using AMM
    Market ->> YMint: Mint Yes Tokens
    YMint ->> YesPool: Mint Token to YesPool
    Market->>NMint: Mint No Token Mint
    NMint ->> NoPool: Mint Token to No pool

    LP->>LP_PDA: Add Liquidity to LP PDA

    alt Equal prices (0.5/0.5)
        Note over LP,Pool: No outcome tokens<br/>when prices are equal
    else Unequal prices

        alt Yes token is more likely
            YMint->>LP: Mint Yes tokens
            Note over LP: Receives Yes tokens<br/>for higher probability
        else No token is more likely
            NMint->>LP: Mint No tokens
            Note over LP: Receives No tokens<br/>for higher probability
        end
    end

    Market->>Market: Update total_liquidity_shares

    Note over LP,Pool: Liquidity provision complete<br/>LP has position established
```

### Liquidity Provided provides liquidity

two main scenarios:

1. Equal Prices (0.5/0.5):

   - No outcome tokens are minted to Liquidity provided
   - Simple liquidity addition

2. Unequal Prices:

   - AMM calculates token distribution using constant product formula
   - Additional outcome tokens for the more likely outcome to LP

3. USDC is transferred to the pool
4. Market's total_liquidity_shares is updated

## Buy Prediction

```mermaid
sequenceDiagram
    participant Trader
    participant Market
    participant LP_Pool
    participant YesMint
    participant NoMint
    participant YesPool
    participant NoPool
    participant TraderYesATA
    participant TraderNoATA

    Trader->>Market: Request to buy prediction
    Note over Market: Calculate token amounts<br/>using AMM formula

    Market->>YesMint: Request mint tokens
    YesMint->>YesPool: Mint to Yes Pool
    Market->>NoMint: Request mint tokens
    NoMint->>NoPool: Mint to No Pool

    alt Buy Yes Prediction
        YesPool->>TraderYesATA: Transfer Yes tokens
        Note over TraderYesATA: Yes tokens transferred<br/>to trader's account
    else Buy No Prediction
        NoPool->>TraderNoATA: Transfer No tokens
        Note over TraderNoATA: No tokens transferred<br/>to trader's account
    end

    Market->>Trader: Return trade confirmation
    Note over Trader: Trader now holds<br/>prediction tokens
```

### Trader Buys Prediction

1. Initial Request:

   - Trader initiates buy request
   - Market performs AMM calculations internally

2. Fee Processing:

   - Pool calculates trading fees based on market settings
   - Final amount determined after fees

3. Token Minting:
   - Yes or No tokens are minted based on prediction choice
   - Tokens are sent to trader's token account

## Trader Sells Token

```mermaid
sequenceDiagram
    participant Trader
    participant Market
    participant Pool
    participant YesMint
    participant NoMint
    participant YesPool
    participant NoPool
    participant TraderYesATA
    participant TraderNoATA

    Trader->>Market: Request to sell prediction
    Note over Market: Calculate token amounts<br/>using AMM formula


    alt Sell Yes Prediction
        TraderYesATA->>YesPool: Send Yes tokens
        Market->>YesMint: Initiate Burn Token
        YesMint->>YesMint: Burn Yes tokens
        Note over YesPool: Yes tokens burned<br/>from Yes Pool
    else Sell No Prediction
        Market->>NoMint: Initiate Burn Token
        TraderNoATA->>NoPool: Send No tokens
        NoMint->>NoMint: Burn No tokens
        Note over NoPool: No tokens burned<br/>from No Pool
    end

    Pool ->> Trader: Return USDC from selling
    Market->>Trader: Return trade confirmation
    Note over Trader: Trader receives USDC<br/>for sold prediction
```

1. Token Flow:

   - Instead of minting new tokens, existing tokens are burned
   - Tokens flow from Trader's Associated Token Account to the respective mint for burning

2. USDC Flow:

   - Trader receives USDC in return for burned prediction tokens

3. Process Order:

   - Starts with token burn approval
   - Ends with USDC transfer to trader

## Market Resolution

```mermaid
sequenceDiagram
    participant Trader
    participant Market
    participant Pool
    participant YesMint
    participant NoMint
    participant YesPool
    participant NoPool
    participant TraderYesATA
    participant TraderNoATA

    Trader->>Market: Request token redemption
    Market->>Market: Check if resolved
    Note over Market: Verify market is resolved<br/>and outcome is set

    alt Yes Outcome Won
        TraderYesATA->>YesPool: Send Yes tokens
        Market->>Market: Calculate redemption amount
        Market->>YesMint: Initiate Burn Yes tokens
        YesMint->>YesPool: Burn Yes Tokens
        Pool->>Trader: Send winning amount
        Note over Trader: Receives 1 USDC per token

        opt Has No Tokens
            TraderNoATA->>NoMint: Send No tokens
            NoMint->>NoMint: Burn No tokens
            Note over TraderNoATA: No tokens burned<br/>worth 0 USDC
        end

    else No Outcome Won
        TraderNoATA->>NoPool: Send No tokens
        Market->>Market: Calculate redemption amount
        Market->>NoMint: Initiate Burn No tokens
        NoMint->>NoPool: Burn No tokens
        Pool->>Trader: Send winning amount
        Note over Trader: Receives 1 USDC per token

        opt Has Yes Tokens
            TraderYesATA->>YesMint: Send Yes tokens
            YesMint->>YesMint: Burn Yes tokens
            Note over TraderYesATA: Yes tokens burned<br/>worth 0 USDC
        end
    end

    Note over Market: Redemption complete
```

1. Initial Check:

   - Trader requests redemption
   - Market verifies it's resolved and outcome is set

2. Winning Outcome Handling:

   - If Yes won:

     1. Yes tokens are burned and redeemed for 1 USDC each
     2. No tokens can be burned but are worth 0 USDC

   - If No won:

     1. No tokens are burned and redeemed for 1 USDC each
     2. Yes tokens can be burned but are worth 0 USDC

3. Pool Updates:

   - Pool state is updated after redemption
   - Final confirmation to trader
