# Q4 Opinion Market

Q4 is a short-term prediction market platform. Users stake USDT on YES or NO outcomes of real-world events that resolve automatically within hours — not weeks. When the deadline arrives the oracle fetches the verified result, the market closes, and winners are paid proportionally from the losing pool.

---

## How It Works

```
Generate → Predict → Wait → Verify → Resolve → Payout
```

1. **Generate** — The backend detects when active markets drop below 10 and automatically creates replacements using live price data + question templates.
2. **Predict** — Users browse open markets, choose YES or NO, and stake USDT. Multiple positions on the same side are allowed; the chosen side is locked after the first stake.
3. **Wait** — Each market has a specific deadline (usually a few hours away).
4. **Verify** — At the deadline the oracle fetches the real-world result from a verified data source (CoinGecko, weather API, etc.).
5. **Resolve** — The market resolves YES or NO automatically.
6. **Payout** — Losers forfeit their stake. 5 % platform fee is taken from the losing pool. The remaining 95 % is distributed proportionally to winners based on each winner's share of the total winning pool. Winners also receive their original stake back.

---

## Staking Rules

| Rule | Detail |
|---|---|
| Minimum stake | $2 USDT per position |
| Multiple positions | Allowed — stake as many times as you like |
| Side locking | Your YES/NO answer locks permanently after the first confirmed stake |
| Balance check | USDT balance is verified before every stake |
| Withdrawals | Confirmed positions cannot be withdrawn |
| Cancellation refund | Full refund if the market is cancelled |

---

## Payout Formula

```
net_lose  = losing_pool × 0.95
payout    = your_stake + (your_stake / total_win_pool) × net_lose
```

Example — Total pool $100, YES wins $60, NO loses $40:

| Winner | Staked | Share | Bonus | Total |
|---|---|---|---|---|
| A | $30 | 50 % | $19.00 | $49.00 |
| B | $20 | 33 % | $12.67 | $32.67 |
| C | $10 | 17 % | $6.33  | $16.33 |

Platform keeps $2 (5 % of $40). Total paid out = $98.

---

## Repository Structure

```
Q4/
├── front-end/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Full dashboard (markets, positions, rewards, admin)
│   │   │   ├── WalletPage.jsx       # Embedded QUAI wallet
│   │   │   ├── HomePage.jsx
│   │   │   ├── HowItWorksPage.jsx
│   │   │   ├── MarketsPage.jsx
│   │   │   ├── PollsPage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── FaqPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── hooks/
│   │   │   ├── useMarkets.js        # Live market list + single market (with participant_count)
│   │   │   ├── usePositions.js      # User's open/resolved positions
│   │   │   ├── useRewards.js        # Claimable rewards
│   │   │   ├── useResults.js        # Resolved market history
│   │   │   ├── useNotifications.js  # Bell notifications
│   │   │   └── useAdminData.js      # Admin: users, markets, stats, oracle, events
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Firebase auth + Supabase user sync
│   │   │   └── WalletContext.jsx    # Embedded QUAI wallet state
│   │   ├── services/
│   │   │   ├── blippay.js           # BlipPay wallet API (QUAI balance, tx, price)
│   │   │   └── useBlipPay.js        # React hooks over blippay.js
│   │   └── lib/
│   │       └── supabase.js          # Single Supabase client (anon key + firebase_uid header)
│   └── .env                         # Environment variables (see below)
│
├── smart_contract/               # Solidity contracts (Foundry)
│   ├── src/
│   │   ├── Q4Market.sol             # Individual market contract
│   │   └── Q4MarketFactory.sol      # Deploys and manages markets
│   ├── test/
│   │   └── Q4Market.t.sol           # 40 tests — all passing
│   └── script/
│       └── Deploy.s.sol             # Deployment script
│
├── supabase/
│   └── functions/
│       ├── generate-markets/        # Queue-based market generator (Deno edge function)
│       └── resolve-markets/         # Oracle resolver + payout calculator (Deno edge function)
│
└── SQL/
    ├── first.sql                    # Full schema + RLS policies
    ├── add_policies.sql             # Supplementary RLS policies
    └── migration_multiple_positions.sql  # Drops unique constraint, adds RPCs
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20 (Foundry) |
| Frontend | React 18 + Vite 7 |
| Styling | Tailwind CSS + inline design tokens |
| Auth | Firebase (Google sign-in) |
| Backend / DB | Supabase (PostgreSQL + Edge Functions + pg_cron) |
| Wallet | BlipPay embedded QUAI wallet |
| Oracle | CoinGecko price API (crypto markets) |
| Deployment | Vercel (frontend) |

---

## System Architecture

```
User Browser
    │
    ├── Firebase Auth (Google)
    │       └── AuthContext → syncs user to Supabase users table
    │
    ├── React Frontend (Vite)
    │       ├── DashboardPage  ← main app (markets, staking, positions, rewards)
    │       ├── WalletPage     ← QUAI balance + send/receive
    │       └── Public pages   ← Home, How It Works, FAQ, About
    │
    ├── Supabase (PostgreSQL + RLS)
    │       ├── markets            ← question, deadline, status, resolution spec
    │       ├── market_outcomes    ← YES/NO pool amounts + participant counts
    │       ├── user_positions     ← each stake row (multiple per user per market)
    │       ├── rewards            ← claimable payouts after resolution
    │       ├── notifications      ← win/lose alerts
    │       ├── oracle_results     ← raw oracle values at resolution
    │       └── market_events      ← audit log
    │
    └── Supabase Edge Functions (Deno)
            ├── generate-markets   ← runs every 5 min via pg_cron
            │       checks active count < 10 → creates replacements
            └── resolve-markets    ← runs every 5 min via pg_cron
                    resolves expired markets → calculates rewards → triggers generator
```

---

## Database Schema (Key Tables)

### markets
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| question | text | Prediction question |
| category | text | Crypto / Sports / Weather / Stocks |
| status | enum | active / closed / resolved / paused / cancelled |
| deadline | timestamptz | When predictions close |
| resolved_outcome | enum | YES / NO (set on resolution) |
| data_source | text | Human-readable source name |
| coin_id | text | CoinGecko coin ID (for crypto auto-resolution) |
| target_value | numeric | Price/value threshold for YES condition |
| resolution_field | text | price / rain_mm / close_price / score |
| resolution_op | text | gt / gte / lt / lte / eq |
| target_time | timestamptz | Exact UTC moment to query the oracle |

### user_positions
Multiple rows per user per market are allowed. Side is locked app-side after the first stake.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | References users.id |
| market_id | uuid | References markets.id |
| side | enum | YES / NO |
| amount | numeric | USDT amount for this position |
| switched | boolean | Legacy column — always false |

### market_outcomes
| Column | Type | Description |
|---|---|---|
| market_id | uuid | References markets.id |
| outcome | enum | YES / NO |
| pool_amount | numeric | Total USDT staked on this side |
| participant_count | integer | Number of stakes on this side |

---

## Automatic Market Queue

The system maintains exactly **10 active markets** at all times.

```
pg_cron (every 5 min)
    └── resolve-markets edge function
            ├── Resolves all expired markets
            │       └── Compares actual oracle value against target_value + resolution_op
            ├── Calculates proportional rewards (5% fee, 95% to winners)
            ├── Inserts reward rows + sends notifications
            └── Triggers generate-markets
                    └── Counts active markets
                        If < 10: fetches live BTC/ETH/QUAI prices from CoinGecko
                                 Creates replacement markets with full resolution spec
                                 (question, coin_id, target_value, resolution_op, deadline)
```

Each generated market knows at creation time:
- **What** is being asked
- **Which data source** answers it
- **When** to check
- **What exact condition** means YES

---

## Dashboard Sections

| Section | Route | Description |
|---|---|---|
| Home | `/dashboard/home` | Market overview, live feed, quick stats |
| Markets | `/dashboard/markets` | Browse and filter all active markets |
| Question Detail | `/dashboard/markets/:id` | Market info, staking card, rules, payout preview |
| My Positions | `/dashboard/convictions` | All open and resolved positions |
| Results | `/dashboard/results` | Resolved market history with outcomes |
| Rewards | `/dashboard/rewards` | Claimable payouts from winning positions |
| Leaderboard | `/dashboard/leaderboard` | Top predictors by performance |
| How It Works | `/dashboard/how` | Platform explainer |
| Wallet | `/dashboard/wallet` | QUAI balance, send, receive, transactions |
| Admin | `/dashboard/admin` | Admin only: manage markets, users, oracle, events |

---

## Smart Contracts

### Q4Market.sol

Individual market contract. Deployed once per market by the factory.

**Key behaviour:**
- `predict(bool isYes)` — stake on YES or NO; multiple calls accumulate on the same locked side
- `closeMarket()` — permissionless, callable by anyone after the deadline
- `resolve(bool outcome)` — oracle/factory only; calculates 5% fee on losing pool
- `claimReward()` — pull pattern; winners call this to receive their payout
- `cancelMarket()` — oracle/factory only; populates refund ledger
- `withdrawRefund()` — users pull their full refund after cancellation
- `withdrawFees()` — factory only; sends accrued protocol fees to factory → owner

**Constants:**
```solidity
PROTOCOL_FEE_BPS = 500   // 5%
```

### Q4MarketFactory.sol

Deploys and administers markets. Holds the oracle address and forwards fee proceeds to the owner.

**Key functions:**
- `createMarket(question, category, deadline)` — owner or oracle
- `resolveMarket(marketId, outcome)` — owner or oracle
- `cancelMarket(marketId)` — owner or oracle
- `collectFees(marketId)` — owner only; pulls fees from a market and sends to owner
- `setOracle(newOracle)` — owner only
- `transferOwnership(newOwner)` — owner only

---

## Environment Variables

### `front-end/.env`

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# Supabase — browser-safe keys (governed by RLS)
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side only — never in browser bundle
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ACCESS_TOKEN=sbp_...
```

### Supabase Edge Function Secrets (set via Supabase dashboard)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
COINGECKO_API_KEY          (optional — improves rate limits)
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- A Supabase project

### 1. Database Setup

Run in the Supabase SQL Editor in order:

```
SQL/first.sql
SQL/add_policies.sql
SQL/migration_multiple_positions.sql
```

### 2. Frontend

```bash
cd front-end
npm install
npm run dev
```

### 3. Smart Contracts

```bash
cd smart_contract
forge build
forge test          # 40 tests, all passing
```

Deploy to Quai Network:

```bash
PRIVATE_KEY=<deployer_key> ORACLE_ADDRESS=<oracle_wallet> \
  forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### 4. Edge Functions

```bash
# Deploy both functions
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy generate-markets --project-ref <ref>
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy resolve-markets   --project-ref <ref>
```

The pg_cron job is created automatically by the migration SQL. The resolver runs every 5 minutes, resolves expired markets, and triggers the generator to refill the queue.

---

## RLS Security Model

All Supabase tables have Row Level Security enabled.

The frontend passes the signed-in user's Firebase UID in an `x-firebase-uid` request header. The `firebase_uid()` Postgres function reads this header and resolves it to the user's Supabase UUID for policy enforcement.

| Table | Read | Insert | Update |
|---|---|---|---|
| markets | public (active/closed/resolved) | admin only | admin only |
| market_outcomes | public | via `increment_pool` RPC | via `increment_pool` RPC |
| user_positions | own rows only | own rows only | own rows only |
| rewards | own rows only | service role | own rows only (claim) |
| notifications | own rows only | service role | own rows only (mark read) |
| users | public | self on sign-up | self only |

The `increment_pool` and `switch_pool` RPCs run as `SECURITY DEFINER` — they update pool amounts atomically without exposing direct write access to `market_outcomes`.

---

## What Is Still Needed

| Item | Status | Notes |
|---|---|---|
| Sports oracle integration | Not wired | Needs a sports data API key in Supabase secrets |
| Weather oracle integration | Not wired | Needs OpenWeather API key in Supabase secrets |
| Stocks oracle integration | Not wired | Needs a stock price API key |
| Smart contract deployment | Ready | Contracts pass all 40 tests; need RPC URL + keys |
| Smart contract ↔ Supabase sync | Not built | On-chain positions currently separate from DB positions |
| Leaderboard data | UI exists | Needs real ranking query against user_positions |
| USDT on Quai | Pending | Wallet uses QUAI; USDT staking needs a token contract address |
| Push notifications | Not built | Supabase notifications table exists; delivery not wired |
