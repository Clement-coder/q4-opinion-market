# Q4 Frontend

React + TypeScript frontend for the Q4 capital-weighted consensus market protocol. Built with Vite and styled with Tailwind CSS.

---

## Overview

The frontend provides the user interface for interacting with Q4 markets on Quai Network. It intentionally excludes participant counts from the public market view — only aggregate capital committed to each outcome is displayed.

### Primary Views

- **Market Discovery** — Browse active, upcoming, and completed markets.
- **Market View** — Displays the market question, outcomes, capital committed per outcome, percentage share, closing time, and status.
- **Participation** — Connect a Quai-compatible wallet, select an outcome, and commit capital directly to the smart contract.
- **Settlement View** — After settlement, displays the winning outcome and eligible claim information.

---

## Prerequisites

- Node.js ≥ 18
- npm or yarn
- A Quai-compatible wallet (browser extension)
- Access to a Supabase project for application data

---

## Setup

```bash
cd front_end
npm install
```

Create a `.env.local` file in the `front_end` directory and add the required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_QUAI_RPC_URL=your_quai_rpc_url
VITE_MARKET_FACTORY_ADDRESS=your_factory_contract_address
```

---

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Build

```bash
npm run build
```

Output is written to the `dist/` directory.

---

## Lint

```bash
npm run lint
```

---

## Data Flow

User transactions are submitted directly to the Q4 smart contract on Quai Network. The smart contract is the authoritative source for all financial data (positions, outcome balances, settlement results).

Supabase provides supporting application data — market metadata, descriptions, categories, images, and indexed blockchain events — that the frontend uses for display and search. Supabase does not hold funds or affect settlement.

---

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Framework | React + TypeScript  |
| Build     | Vite                |
| Styling   | Tailwind CSS        |
| Backend   | Supabase            |
| Blockchain| Quai Network        |
