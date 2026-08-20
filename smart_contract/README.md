# Q4 Smart Contracts

Solidity smart contracts for the Q4 Opinion Market protocol, built with [Foundry](https://book.getfoundry.sh/).

---

## Contracts

### Q4MarketFactory (`src/Q4MarketFactory.sol`)
Deploys and registers Q4Market instances. Collects 2% protocol fees.

| Function | Description |
|---|---|
| `createMarket(question, category, deadline)` | Deploy a new market, returns `(marketId, address)` |
| `resolveMarket(marketId, outcome)` | Resolve a market YES/NO — owner or oracle only |
| `cancelMarket(marketId)` | Cancel and refund all stakers |
| `closeMarket(marketId)` | Close a market once deadline passes |
| `getMarket(marketId)` | Get market address by ID |
| `getAllMarkets()` | Get all deployed market addresses |
| `setOracle(address)` | Update the oracle address — owner only |
| `collectFees(marketId)` | Pull protocol fees from a market |
| `withdrawFees()` | Withdraw all accumulated fees to owner |

### Q4Market (`src/Q4Market.sol`)
Each deployed market manages its own state, pools, and payouts independently.

| Function | Description |
|---|---|
| `predict(bool isYes)` | Stake QUAI on YES or NO (payable) |
| `switchSide(bool newSide)` | Switch once, ≥5 min before deadline |
| `closeMarket()` | Close when deadline reached — permissionless |
| `resolve(bool outcome)` | Resolve YES/NO — oracle or factory only |
| `claimReward()` | Winners claim proportional share of losing pool |
| `cancelMarket()` | Cancel + refund all — oracle or factory only |
| `pendingReward(address)` | View pending payout for a winner |
| `getPosition(address)` | View a user's position |
| `getMarketInfo()` | View all market state |

**Reward formula:**
```
netLosingPool = losingPool × 0.98      (2% protocol fee)
reward = stake + (stake / winPool) × netLosingPool
```

---

## Deployed Addresses

> Update this section after deployment.

| Network | Contract | Address |
|---|---|---|
| Quai Cyprus-1 Mainnet | Q4MarketFactory | `—` |
| Quai Cyprus-1 Testnet | Q4MarketFactory | `—` |

---

## Setup

```bash
cd smart_contract
forge install
```

---

## Build

```bash
forge build
```

## Test

```bash
forge test -v
```

All 27 tests pass covering: predict, switch, close, resolve, claim, cancel, fees, access control.

---

## Deployment

### 1. Set environment variables

```bash
# .env (never commit this)
PRIVATE_KEY=0x...your_deployer_private_key...
ORACLE_ADDRESS=0x...your_oracle_or_admin_address...
```

### 2. Deploy to Quai Network

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.quai.network/cyprus1 \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### 3. Deploy to local Anvil (development)

```bash
# Terminal 1 — start local node
anvil

# Terminal 2 — deploy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

---

## Market Lifecycle

```
Active → Closed → Resolved
   └──────────────────────→ Cancelled (any time before resolution)
```

1. **Active** — Users predict YES or NO. Switch allowed once (≥5 min before deadline).
2. **Closed** — Deadline reached. No new predictions. `closeMarket()` callable by anyone.
3. **Resolved** — Oracle calls `resolve(bool)`. Winners call `claimReward()`.
4. **Cancelled** — Oracle cancels market. All stakers refunded automatically.

---

## Integration with Frontend

After deploying, add the factory address to your `.env`:

```
VITE_FACTORY_ADDRESS=0x...
VITE_QUAI_RPC=https://rpc.quai.network/cyprus1
```

The frontend currently uses Supabase as the primary data layer. On-chain settlement is the authoritative source for funds — Supabase mirrors market state for fast UI reads.
