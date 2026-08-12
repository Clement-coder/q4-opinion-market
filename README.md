# Q4 — Capital Weighted Consensus Markets on Quai Network

Q4 is a decentralized consensus market protocol built on Quai Network. Instead of measuring how many people support an outcome, Q4 measures how much capital participants have committed to it — producing an economic conviction signal rather than a popularity signal.

---

## The Core Idea

Traditional voting and prediction interfaces expose participant counts. This can nudge users toward popular options regardless of the underlying conviction behind those positions.

Q4 removes participant counts from the public interface entirely. What the market surfaces is the aggregate capital committed to each outcome:

| Outcome | Capital Committed | Market Share |
|---------|-----------------|--------------|
| Team A  | $8,500          | 53.75%       |
| Team B  | $5,200          | 32.91%       |
| Draw    | $2,100          | 13.29%       |

The market signal is simply:

```
Capital committed to outcome / Total market capital
```

---

## How It Works

### Market Lifecycle

1. **Created** — Market is deployed with a question, outcomes, opening time, closing time, and settlement configuration.
2. **Active** — Participants connect their Quai-compatible wallet and commit capital to an outcome of their choice.
3. **Closed** — The market reaches its configured closing time and rejects further commitments.
4. **Settled** — The smart contract determines the consensus outcome (highest eligible capital at close) and makes rewards available for withdrawal.

### Consensus Mechanism

For the initial implementation, the outcome with the highest capital commitment at market close is the consensus outcome. Settlement logic lives entirely in the smart contract — no centralized backend is involved in determining the result.

### Non-Custodial Architecture

Users approve transactions directly from their own wallets. The backend never holds or controls participant funds. Smart contracts enforce market opening, closing, capital accounting, settlement, and reward claims.

---

## Repository Structure

```
Q4/
├── smart_contract/   # Solidity contracts (Foundry)
├── front_end/        # React / Next.js frontend (Vite)
└── SQL/              # Supabase database schema
```

---

## Technology Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Blockchain     | Quai Network            |
| Smart Contracts| Solidity (Foundry)      |
| Frontend       | React / Next.js + Vite  |
| Styling        | Tailwind CSS            |
| Backend        | Supabase                |
| Database       | PostgreSQL              |
| Wallet         | Quai-compatible wallet  |
| Source Control | GitHub                  |

---

## Architecture Overview

```
User
  |
  v
Q4 Frontend
  |
  +--------------------+
  |                    |
  v                    v
Quai Network        Supabase
  |                    |
  v                    v
Smart Contracts     Application Data
  |
  v
Market State (authoritative)
```

**Quai Network / Smart Contracts** — Authoritative source for all financial state: user positions, outcome balances, market lifecycle, settlement, and reward claims.

**Supabase** — Application and indexing layer. Stores market metadata (descriptions, categories, images), indexed blockchain events, user profiles, and search data. Does not custody funds or determine outcomes.

---

## Smart Contract Overview

### Market Factory
Responsible for deploying and registering Q4 markets.

- `createMarket()` — Deploy a new market with its configuration.
- `getMarket()` — Retrieve a market reference by ID.

### Market Contract
Each market maintains its own state independently.

Key fields: `marketId`, `question`, `outcomes`, `startTime`, `endTime`, `status`, `totalCapital`

Capital per outcome is tracked as: `outcomeId => totalCapital`

Participant positions are recorded on-chain for settlement and reward calculations.

---

## Supabase Schema (Core Tables)

**markets** — `id`, `contract_market_id`, `question`, `description`, `category`, `status`, `start_time`, `end_time`, `created_at`

**market_outcomes** — `id`, `market_id`, `outcome_id`, `name`

**users** — `id`, `wallet_address`, `created_at`

**market_events** — `id`, `market_id`, `event_type`, `transaction_hash`, `block_number`, `created_at`

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- A Quai-compatible wallet
- A Supabase project

### Smart Contracts

```bash
cd smart_contract
forge build
forge test
```

See [`smart_contract/README.md`](./smart_contract/README.md) for deployment instructions.

### Frontend

```bash
cd front_end
npm install
npm run dev
```

See [`front_end/README.md`](./front_end/README.md) for environment configuration.

---

## MVP Scope

The hackathon MVP demonstrates the core Q4 mechanism:

- Quai Network integration and wallet connection
- Market creation with multiple outcomes
- Capital commitment and aggregate capital tracking
- Capital-based market display with participant counts hidden
- Market closing and smart contract settlement
- Reward claims
- Supabase market metadata and blockchain event indexing

---

## Future Development

- Community consensus markets
- DAO decision markets
- Ecosystem sentiment markets
- Protocol activity markets
- On-chain consensus data consumable by external Quai ecosystem applications

---

## Vision

Q4 aims to be a decentralized market primitive for measuring collective economic conviction. The initial implementation targets prediction and consensus markets. The underlying infrastructure is designed to support any application where communities need a transparent, capital-weighted mechanism for expressing and measuring conviction on-chain.
