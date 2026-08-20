-- ============================================================
-- Migration: add contract_address to markets + rewards tables
-- and on-chain claim tracking columns.
--
-- Run this in the Supabase SQL Editor AFTER first.sql.
-- ============================================================

-- 1. Add contract_address to markets
--    This stores the deployed Q4Market.sol contract address for each market.
--    Populated by the generate-markets edge function when it creates a market.
alter table public.markets
  add column if not exists contract_address text;

-- Index for fast on-chain lookups
create index if not exists idx_markets_contract on public.markets(contract_address)
  where contract_address is not null;

-- 2. Add on-chain claim tracking to rewards
--    tx_hash: the Quai transaction hash of the claimReward() call
--    claimed_on_chain: true once claimReward() tx is confirmed
alter table public.rewards
  add column if not exists tx_hash          text,
  add column if not exists claimed_on_chain boolean not null default false;

-- 3. Add on-chain tx tracking to user_positions
--    stake_tx_hash: the predict() transaction hash
alter table public.user_positions
  add column if not exists stake_tx_hash text;

-- 4. Add refund tracking to user_positions
--    refund_tx_hash: the withdrawRefund() tx hash (for cancelled markets)
alter table public.user_positions
  add column if not exists refund_tx_hash text;
