# Q4 Opinion Market

Q4 Opinion Market is a short-term prediction market platform where users predict the outcome of real-world events that can be verified within 24 hours.

---

## The Core Idea

Instead of long-term speculative questions like "Will Bitcoin reach $150,000?", Q4 focuses on questions with clear, near-term outcomes:

> "Will Bitcoin be above $118,000 at 11:59 PM today?"

Users choose **YES** or **NO**. When the deadline arrives, the system automatically checks a reliable data source, determines the actual outcome, and resolves the market.

---

## How It Works

```
Generate → Predict → Wait → Verify → Resolve
```

1. **Generate** — The system generates short-term prediction questions using predefined templates and live data.
2. **Predict** — Users browse available markets and choose YES or NO.
3. **Wait** — Each market has a specific deadline, usually within 24 hours.
4. **Verify** — When the deadline arrives, the system obtains the actual result from the relevant data source.
5. **Resolve** — The market is automatically resolved as YES or NO and user positions are settled.

---

## Question Categories

| Category       | Example Question                                       |
|----------------|--------------------------------------------------------|
| Crypto         | Will Bitcoin be above $118,000 at 11:59 PM?            |
| Sports         | Will Arsenal score in the first half?                  |
| Weather        | Will it rain in Abuja before 8 PM?                     |
| Stocks         | Will Apple stock close higher today?                   |

Every question has a clearly measurable outcome and a defined resolution time.

---

## Automatic Question Generation

Q4 uses question templates combined with live data to generate markets automatically.

**Template:**
```
Will {ASSET} be above ${PRICE} at {TIME}?
```

**Generated question:**
```
Will Bitcoin be above $118,000 at 11:59 PM today?
```

This allows Q4 to continuously create new markets without manual admin input.

---

## How Q4 Knows the Correct Answer

Q4 uses external data sources (oracles) to verify outcomes at the deadline.

**Example:**
- Question: *Will Bitcoin be above $118,000 at 11:59 PM?*
- BTC price at deadline = $119,200 → Resolves **YES**
- BTC price at deadline = $117,500 → Resolves **NO**

Each question category uses an appropriate verified data source.

---

## Repository Structure

```
Q4/
├── smart_contract/   # Solidity contracts (Foundry)
├── front_end/        # React / Vite frontend
└── SQL/              # Supabase database schema
```

---

## Technology Stack

| Layer          | Technology                   |
|----------------|------------------------------|
| Smart Contracts| Solidity (Foundry)           |
| Frontend       | React + Vite                 |
| Styling        | Tailwind CSS                 |
| Backend        | Supabase                     |
| Database       | PostgreSQL                   |
| Data/Oracle    | External verified data APIs  |
| Source Control | GitHub                       |

---

## System Architecture

```
User
  |
  v
Q4 Frontend
  |
  +---------------------+
  |                     |
  v                     v
Smart Contracts      Supabase
  |                     |
  v                     v
Market State         App Data & Events
  |
  v
Oracle / Data Sources
(Crypto, Sports, Weather, Stocks)
```

**Smart Contracts** — Authoritative source for all financial state: user positions, market lifecycle, resolution, and reward claims.

**Supabase** — Application layer. Stores market metadata, indexed events, user profiles, and oracle results.

**Oracle / Data Sources** — External APIs that provide verified real-world outcomes at market resolution time.

---

## Main Components

### User Platform
- Browse prediction markets
- View market details and deadlines
- Choose YES or NO
- View odds and probabilities
- Track personal positions and results
- Claim rewards

### Market Engine
- Generates questions from templates + live data
- Creates and manages markets
- Sets deadlines
- Closes expired markets

### Data / Oracle System
- Collects external data at deadline
- Verifies actual outcomes
- Determines YES or NO result
- Sends result to resolution system

### Resolution System
- Resolves completed markets
- Determines winning outcome
- Settles user positions

### Admin Dashboard
- Monitor all markets
- Manage categories
- Monitor data sources
- Review generated questions
- Pause or remove problematic markets
- Monitor users and transactions

---

## Smart Contract Overview

### Market Factory
Deploys and registers Q4 prediction markets.

- `createMarket()` — Deploy a new market with its question, outcome options, and deadline.
- `getMarket()` — Retrieve a market reference by ID.

### Market Contract
Each market manages its own state independently.

Key fields: `marketId`, `question`, `deadline`, `status`, `yesPool`, `noPool`, `resolvedOutcome`

Participant positions are recorded on-chain for settlement and reward calculations.

---

## Supabase Schema (Core Tables)

**markets** — `id`, `question`, `category`, `status`, `deadline`, `resolved_outcome`, `data_source`, `created_at`

**market_outcomes** — `id`, `market_id`, `outcome` (YES/NO), `pool_amount`

**users** — `id`, `wallet_address`, `created_at`

**oracle_results** — `id`, `market_id`, `result_value`, `resolved_at`, `data_source`

**market_events** — `id`, `market_id`, `event_type`, `transaction_hash`, `block_number`, `created_at`

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
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
cd front-end
npm install
npm run dev
```

See [`front-end/README.md`](./front-end/README.md) for environment configuration.

---

## MVP Scope

The MVP demonstrates the core Q4 mechanism:

- Automatic question generation from templates
- YES/NO market creation with deadlines
- User predictions and position tracking
- Oracle-based outcome verification
- Automatic market resolution
- Reward claims for correct predictions
- Admin monitoring dashboard

---

## Vision

Q4 aims to be the go-to platform for short-term, verifiable prediction markets. A market can open today, close tonight, and resolve shortly after the deadline — giving users fast, clear feedback on their predictions backed by real-world data.
