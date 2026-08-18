# Q4 Smart Contracts

Solidity smart contracts for the Q4 Opinion Market protocol, built with [Foundry](https://book.getfoundry.sh/).

---

## Overview

The Q4 protocol uses two primary contracts:

**Market Factory** — Deploys and registers Q4 prediction markets.
- `createMarket()` — Deploy a new market with its question, YES/NO outcomes, and deadline.
- `getMarket()` — Retrieve a deployed market by ID.

**Market Contract** — Each market manages its own state independently.
- Tracks the YES pool and NO pool independently.
- Records individual participant positions on-chain for settlement and reward calculations.
- Enforces the market lifecycle: Created → Active → Closed → Resolved.
- Verifies the outcome via oracle result and processes reward claims without any centralized backend involvement.

---

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## Setup

```bash
cd smart_contract
forge install
```

---

## Development

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Format

```bash
forge fmt
```

### Gas Snapshots

```bash
forge snapshot
```

---

## Local Node

```bash
anvil
```

---

## Deployment

```bash
forge script script/<ScriptName>.s.sol:<ContractName> \
  --rpc-url <your_rpc_url> \
  --private-key <your_private_key> \
  --broadcast
```

Replace `<your_rpc_url>` with your RPC endpoint and `<your_private_key>` with your deployer key. Never commit private keys — use environment variables or a `.env` file that is excluded from version control.

---

## Market Lifecycle

```
Created → Active → Closed → Resolved
```

1. **Created** — Market deployed with question, deadline, and oracle data source.
2. **Active** — Users can predict YES or NO and commit positions.
3. **Closed** — Deadline reached; no new predictions accepted.
4. **Resolved** — Oracle result verified; winning side determined; rewards distributed.

---

## Security Considerations

Contract testing covers:

- Access control (only authorized callers can resolve or administer markets)
- Invalid market state transitions
- Duplicate resolution prevention
- Unauthorized withdrawal attempts
- Pool accounting edge cases

---

## Tools

| Tool   | Purpose                                      |
|--------|----------------------------------------------|
| Forge  | Build, test, and deploy contracts            |
| Cast   | Interact with contracts and query chain data |
| Anvil  | Local EVM node for development               |
| Chisel | Interactive Solidity REPL                    |

Full documentation: [https://book.getfoundry.sh/](https://book.getfoundry.sh/)
