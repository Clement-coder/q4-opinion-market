-- ============================================================
-- Q4 Opinion Market — Missing RLS Policies
-- Run this in the Supabase SQL Editor AFTER first.sql
-- ============================================================

-- ── rewards: service role can insert (for oracle resolution) ─────────
create policy "rewards: service insert"
  on public.rewards for insert
  with check (true);

-- ── notifications: service role can insert ───────────────────────────
create policy "notifications: service insert"
  on public.notifications for insert
  with check (true);

-- ── market_outcomes: allow pool updates when positions are placed ─────
create policy "market_outcomes: update pool"
  on public.market_outcomes for update
  using (true);

-- ── market_events: allow inserts (position events, resolution logs) ───
create policy "market_events: insert"
  on public.market_events for insert
  with check (true);

-- ── oracle_results: allow inserts by service role ────────────────────
create policy "oracle_results: insert"
  on public.oracle_results for insert
  with check (true);

-- ── markets: allow status updates by service role (auto-close/resolve)
create policy "markets: service update"
  on public.markets for update
  using (true);

-- ── user_positions: allow inserts by authenticated users (via anon key)
-- (already handled in first.sql but adding explicit insert policy)
-- This is needed for the position placement flow in PageQuestionDetail
create policy "positions: public insert"
  on public.user_positions for insert
  with check (true);
