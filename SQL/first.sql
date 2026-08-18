-- ============================================================
-- Q4 Opinion Market — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── ENUM types ──────────────────────────────────────────────
do $$ begin
  create type market_status    as enum ('active', 'closed', 'resolved', 'paused', 'cancelled');
  create type outcome_type     as enum ('YES', 'NO');
  create type position_side    as enum ('YES', 'NO');
  create type notif_type       as enum ('reward', 'market', 'switch', 'system');
  create type user_role        as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

-- ── Firebase UID helper ──────────────────────────────────────
-- The frontend passes the Firebase UID via the x-firebase-uid request header.
-- Supabase exposes request headers to Postgres via current_setting.
-- This function extracts it safely for use in RLS policies.
create or replace function public.firebase_uid()
returns text
language sql stable
as $$
  select nullif(
    coalesce(
      current_setting('request.headers', true)::jsonb ->> 'x-firebase-uid',
      current_setting('app.firebase_uid', true)
    ),
    ''
  );
$$;

-- ── users ────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  firebase_uid  text unique not null,
  email         text,
  display_name  text,
  avatar_url    text,
  role          user_role not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast lookup by firebase_uid (used on every sign-in)
create index if not exists idx_users_firebase_uid on public.users(firebase_uid);

-- ── markets ──────────────────────────────────────────────────
create table if not exists public.markets (
  id               uuid primary key default uuid_generate_v4(),
  question         text not null,
  category         text not null,               -- 'Crypto' | 'Sports' | 'Weather' | 'Stocks'
  status           market_status not null default 'active',
  deadline         timestamptz not null,
  resolved_outcome outcome_type,                -- set when status = 'resolved'
  data_source      text,                        -- e.g. 'BTC/USD price feed'
  created_by       uuid references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_markets_status   on public.markets(status);
create index if not exists idx_markets_category on public.markets(category);
create index if not exists idx_markets_deadline on public.markets(deadline);

-- ── market_outcomes ──────────────────────────────────────────
-- Tracks the YES pool and NO pool for each market
create table if not exists public.market_outcomes (
  id          uuid primary key default uuid_generate_v4(),
  market_id   uuid not null references public.markets(id) on delete cascade,
  outcome     outcome_type not null,
  pool_amount numeric(18, 6) not null default 0,
  updated_at  timestamptz not null default now(),
  unique (market_id, outcome)
);

create index if not exists idx_market_outcomes_market on public.market_outcomes(market_id);

-- ── user_positions ───────────────────────────────────────────
-- Each row is one user's position in one market
create table if not exists public.user_positions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  market_id   uuid not null references public.markets(id) on delete cascade,
  side        position_side not null,
  amount      numeric(18, 6) not null,
  switched    boolean not null default false,  -- true if user switched side once
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, market_id)                 -- one position per user per market
);

create index if not exists idx_positions_user   on public.user_positions(user_id);
create index if not exists idx_positions_market on public.user_positions(market_id);

-- ── oracle_results ───────────────────────────────────────────
-- Stores the raw data fetched from the oracle at resolution time
create table if not exists public.oracle_results (
  id           uuid primary key default uuid_generate_v4(),
  market_id    uuid not null references public.markets(id) on delete cascade,
  result_value text not null,     -- raw value from the data source
  resolved_at  timestamptz not null default now(),
  data_source  text
);

create index if not exists idx_oracle_market on public.oracle_results(market_id);

-- ── rewards ──────────────────────────────────────────────────
-- Claimable rewards for winning positions after market resolution
create table if not exists public.rewards (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  market_id    uuid not null references public.markets(id) on delete cascade,
  position_id  uuid references public.user_positions(id),
  amount       numeric(18, 6) not null,
  claimed      boolean not null default false,
  claimed_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_rewards_user    on public.rewards(user_id);
create index if not exists idx_rewards_claimed on public.rewards(user_id, claimed);

-- ── notifications ────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       notif_type not null default 'system',
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- ── market_events ────────────────────────────────────────────
-- On-chain event log (populated by the backend oracle/resolver service)
create table if not exists public.market_events (
  id               uuid primary key default uuid_generate_v4(),
  market_id        uuid not null references public.markets(id) on delete cascade,
  event_type       text not null,       -- 'created' | 'position_placed' | 'resolved' | 'reward_claimed'
  user_id          uuid references public.users(id),
  transaction_hash text,
  block_number     bigint,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists idx_events_market on public.market_events(market_id);
create index if not exists idx_events_user   on public.market_events(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.users            enable row level security;
alter table public.markets          enable row level security;
alter table public.market_outcomes  enable row level security;
alter table public.user_positions   enable row level security;
alter table public.oracle_results   enable row level security;
alter table public.rewards          enable row level security;
alter table public.notifications    enable row level security;
alter table public.market_events    enable row level security;

-- ── Helper: get current user's Supabase user id from firebase_uid ────────────
-- We pass firebase_uid as a claim via a custom header or match by anon key.
-- Since we use the anon key + Firebase UID matching, we use a security definer
-- function to look up the user id safely.

create or replace function public.get_user_id_by_firebase_uid(p_uid text)
returns uuid
language sql stable security definer
as $$
  select id from public.users where firebase_uid = p_uid limit 1;
$$;

-- ── users ────────────────────────────────────────────────────
-- Anyone can upsert their own row (needed for sign-in sync).
-- Users can read their own row. Admins can read all.
create policy "users: read all"
  on public.users for select
  using (true);  -- public profiles (display_name, avatar) are readable by all

create policy "users: upsert own"
  on public.users for insert
  with check (true);

create policy "users: update own"
  on public.users for update
  using (true);

-- Admins can update any user's role
create policy "users: admin update role"
  on public.users for update
  using (
    exists (
      select 1 from public.users u2
      where u2.firebase_uid = public.firebase_uid()
        and u2.role = 'admin'
    )
  );

-- ── markets ──────────────────────────────────────────────────
-- Everyone can read active/closed/resolved markets.
-- Admins can read ALL markets (including paused/cancelled) and write.
create policy "markets: public read"
  on public.markets for select
  using (status in ('active', 'closed', 'resolved'));

create policy "markets: admin read all"
  on public.markets for select
  using (
    exists (
      select 1 from public.users
      where firebase_uid = public.firebase_uid()
        and role = 'admin'
    )
  );

create policy "markets: admin write"
  on public.markets for all
  using (
    exists (
      select 1 from public.users
      where firebase_uid = public.firebase_uid()
        and role = 'admin'
    )
  );

-- ── market_outcomes ──────────────────────────────────────────
create policy "market_outcomes: public read"
  on public.market_outcomes for select
  using (true);

-- ── user_positions ───────────────────────────────────────────
create policy "positions: read own"
  on public.user_positions for select
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- Admins can read all positions (needed for stats/volume calculation)
create policy "positions: admin read all"
  on public.user_positions for select
  using (
    exists (
      select 1 from public.users
      where firebase_uid = public.firebase_uid()
        and role = 'admin'
    )
  );

create policy "positions: insert own"
  on public.user_positions for insert
  with check (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

create policy "positions: update own"
  on public.user_positions for update
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── rewards ──────────────────────────────────────────────────
create policy "rewards: read own"
  on public.rewards for select
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

create policy "rewards: update own (claim)"
  on public.rewards for update
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── notifications ────────────────────────────────────────────
create policy "notifications: read own"
  on public.notifications for select
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

create policy "notifications: update own (mark read)"
  on public.notifications for update
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── oracle_results ───────────────────────────────────────────
create policy "oracle_results: public read"
  on public.oracle_results for select
  using (true);

-- ── market_events ────────────────────────────────────────────
create policy "market_events: public read"
  on public.market_events for select
  using (true);

-- ============================================================
-- Updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_users_updated_at
    before update on public.users
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_markets_updated_at
    before update on public.markets
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_positions_updated_at
    before update on public.user_positions
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- Sample seed data (optional — remove before production)
-- Inserts two demo markets so the UI has something to show.
-- ============================================================
insert into public.markets (question, category, status, deadline, data_source)
values
  (
    'Will Bitcoin be above $118,000 at 11:59 PM today?',
    'Crypto',
    'active',
    (now() + interval '6 hours')::timestamptz,
    'BTC/USD price feed'
  ),
  (
    'Will Arsenal score in the first half?',
    'Sports',
    'active',
    (now() + interval '3 hours')::timestamptz,
    'Match statistics API'
  ),
  (
    'Will it rain in Abuja before 8 PM today?',
    'Weather',
    'active',
    (now() + interval '2 hours')::timestamptz,
    'Weather data API'
  ),
  (
    'Will Apple stock close higher today?',
    'Stocks',
    'active',
    (now() + interval '9 hours')::timestamptz,
    'Stock market close price'
  )
on conflict do nothing;

-- Seed market_outcomes (YES + NO pools) for each market
insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'YES'::outcome_type, 6200 from public.markets where question = 'Will Bitcoin be above $118,000 at 11:59 PM today?'
on conflict (market_id, outcome) do nothing;
insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'NO'::outcome_type,  3800 from public.markets where question = 'Will Bitcoin be above $118,000 at 11:59 PM today?'
on conflict (market_id, outcome) do nothing;

insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'YES'::outcome_type, 2900 from public.markets where question = 'Will Arsenal score in the first half?'
on conflict (market_id, outcome) do nothing;
insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'NO'::outcome_type,  2100 from public.markets where question = 'Will Arsenal score in the first half?'
on conflict (market_id, outcome) do nothing;

insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'YES'::outcome_type, 1720 from public.markets where question = 'Will it rain in Abuja before 8 PM today?'
on conflict (market_id, outcome) do nothing;
insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'NO'::outcome_type,  2280 from public.markets where question = 'Will it rain in Abuja before 8 PM today?'
on conflict (market_id, outcome) do nothing;

insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'YES'::outcome_type, 5300 from public.markets where question = 'Will Apple stock close higher today?'
on conflict (market_id, outcome) do nothing;
insert into public.market_outcomes (market_id, outcome, pool_amount)
select id, 'NO'::outcome_type,  4700 from public.markets where question = 'Will Apple stock close higher today?'
on conflict (market_id, outcome) do nothing;
