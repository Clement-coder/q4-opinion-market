-- ============================================================
-- Q4 Opinion Market — Fix RLS Policies for Staking
-- Run this in the Supabase SQL Editor to fix the RLS issues
-- ============================================================

-- ── First, fix the firebase_uid() function to handle both header and app setting ──
create or replace function public.firebase_uid()
returns text
language sql stable
as $$
  select coalesce(
    -- Try x-firebase-uid header first (used by our custom client setup)
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-firebase-uid', ''),
    -- Fall back to app setting (legacy support)
    nullif(current_setting('app.firebase_uid', true), ''),
    -- If neither exists, return null
    null
  );
$$;

-- ── Drop existing problematic policies for user_positions ──
drop policy if exists "positions: insert own" on public.user_positions;
drop policy if exists "positions: public insert" on public.user_positions;
drop policy if exists "positions: authenticated insert" on public.user_positions;
drop policy if exists "positions: service insert" on public.user_positions;

-- ── Create a simple, working policy for inserting positions ──
create policy "positions: user can insert own"
  on public.user_positions for insert
  with check (
    -- Allow if user_id matches the current authenticated user
    user_id = (
      select u.id 
      from public.users u 
      where u.firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── Alternative policy for service role operations ──
create policy "positions: service role can insert"
  on public.user_positions for insert
  with check (
    -- Check if this is a service role request (no firebase_uid in header)
    public.firebase_uid() is null
  );

-- ── Verify other policies are correct ──

-- Drop and recreate the read policy for positions to ensure consistency
drop policy if exists "positions: read own" on public.user_positions;
create policy "positions: read own"
  on public.user_positions for select
  using (
    user_id = (
      select u.id 
      from public.users u 
      where u.firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- Drop and recreate the update policy for positions
drop policy if exists "positions: update own" on public.user_positions;
create policy "positions: update own"
  on public.user_positions for update
  using (
    user_id = (
      select u.id 
      from public.users u 
      where u.firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── Debug: Create a helper function to check current user ──
create or replace function public.debug_current_user()
returns table (
  firebase_uid_from_header text,
  firebase_uid_from_app text,
  firebase_uid_result text,
  user_id_found uuid,
  user_email text
)
language sql
as $$
  select 
    current_setting('request.headers', true)::jsonb ->> 'x-firebase-uid' as firebase_uid_from_header,
    current_setting('app.firebase_uid', true) as firebase_uid_from_app,
    public.firebase_uid() as firebase_uid_result,
    u.id as user_id_found,
    u.email as user_email
  from public.users u 
  where u.firebase_uid = public.firebase_uid()
  limit 1;
$$;

-- ── Grant necessary permissions ──
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
