-- ============================================================
-- Q4 Opinion Market — Multiple Positions Migration
-- Run this in the Supabase SQL Editor AFTER first.sql and add_policies.sql
-- ============================================================

-- ── Drop unique constraint to allow multiple positions per user per market ──
alter table public.user_positions
drop constraint if exists user_positions_user_id_market_id_key;

-- ── Add participant_count column to market_outcomes ──
alter table public.market_outcomes 
add column if not exists participant_count integer not null default 0;

-- ── Add resolution spec columns to markets for auto-resolution ──
alter table public.markets 
add column if not exists coin_id text,                    -- CoinGecko coin ID (e.g. 'bitcoin')
add column if not exists target_value numeric(18, 6),     -- Price threshold for YES condition
add column if not exists resolution_field text,           -- 'price' | 'rain_mm' | 'close_price' | 'score'
add column if not exists resolution_op text,              -- 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
add column if not exists target_time timestamptz;         -- Exact UTC moment to query the oracle

-- ── Add indexes for new columns ──
create index if not exists idx_markets_target_time on public.markets(target_time);
create index if not exists idx_markets_coin_id on public.markets(coin_id);

-- ── RPCs for atomic pool operations ──
create or replace function public.increment_pool(
  p_market_id uuid,
  p_outcome outcome_type,
  p_amount numeric
)
returns void
language plpgsql security definer
as $$
begin
  -- Update pool amount and participant count atomically
  update public.market_outcomes
  set 
    pool_amount = pool_amount + p_amount,
    participant_count = participant_count + 1,
    updated_at = now()
  where market_id = p_market_id and outcome = p_outcome;
  
  -- Insert if not exists
  if not found then
    insert into public.market_outcomes (market_id, outcome, pool_amount, participant_count)
    values (p_market_id, p_outcome, p_amount, 1);
  end if;
end;
$$;

create or replace function public.switch_pool(
  p_market_id uuid,
  p_old_side outcome_type,
  p_new_side outcome_type,
  p_amount numeric
)
returns void
language plpgsql security definer
as $$
begin
  -- Decrease old side
  update public.market_outcomes
  set 
    pool_amount = greatest(0, pool_amount - p_amount),
    participant_count = greatest(0, participant_count - 1),
    updated_at = now()
  where market_id = p_market_id and outcome = p_old_side;
  
  -- Increase new side
  update public.market_outcomes
  set 
    pool_amount = pool_amount + p_amount,
    participant_count = participant_count + 1,
    updated_at = now()
  where market_id = p_market_id and outcome = p_new_side;
  
  -- Insert new side if not exists
  if not found then
    insert into public.market_outcomes (market_id, outcome, pool_amount, participant_count)
    values (p_market_id, p_new_side, p_amount, 1);
  end if;
end;
$$;

-- ── Set up pg_cron job for auto-resolution (if extension is available) ──
-- This will run the resolve-markets edge function every 5 minutes
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Clear existing job first
    perform cron.unschedule('resolve-markets-job');
    
    -- Schedule new job every 5 minutes
    perform cron.schedule(
      'resolve-markets-job',
      '*/5 * * * *',  -- every 5 minutes
      'select net.http_post(
        url := ''YOUR_SUPABASE_URL/functions/v1/resolve-markets'',
        headers := jsonb_build_object(''Authorization'', ''Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY''),
        body := jsonb_build_object()
      );'
    );
  end if;
exception when others then
  -- pg_cron extension may not be available, continue silently
  null;
end $$;

-- ── Updated RLS policies for multiple positions ──

-- Drop the old restrictive policy
drop policy if exists "positions: insert own" on public.user_positions;
drop policy if exists "positions: public insert" on public.user_positions;

-- Create new policy that allows multiple positions per user per market
create policy "positions: authenticated insert"
  on public.user_positions for insert
  with check (
    -- Must be authenticated (have a firebase_uid)
    public.firebase_uid() is not null
    and
    -- The user_id must match the current user
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- Allow service role to insert positions (needed for admin operations)
create policy "positions: service insert"
  on public.user_positions for insert
  with check (true);

-- ── Backfill participant_count for existing markets ──
update public.market_outcomes
set participant_count = (
  select count(distinct user_id)
  from public.user_positions up
  where up.market_id = market_outcomes.market_id
    and up.side::text = market_outcomes.outcome::text
)
where participant_count = 0;
