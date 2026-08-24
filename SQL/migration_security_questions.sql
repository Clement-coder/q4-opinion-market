-- ============================================================
-- Q4 — Security Questions Migration
-- Run this in the Supabase SQL Editor after first.sql
-- ============================================================

-- Table: user_security_questions
-- Stores the three security Q&A pairs for each user.
-- Answers are stored as bcrypt hashes (via pgcrypto) so the
-- raw answer is never persisted in plaintext.
create table if not exists public.user_security_questions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  q1           text not null,
  a1_hash      text not null,   -- crypt(lower(trim(answer)), gen_salt('bf'))
  q2           text not null,
  a2_hash      text not null,
  q3           text not null,
  a3_hash      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id)              -- one row per user; upsert to update
);

create index if not exists idx_security_questions_user
  on public.user_security_questions(user_id);

-- RLS
alter table public.user_security_questions enable row level security;

-- Users may read their own questions (question text only — hashes stay server-side)
create policy "security_questions: read own"
  on public.user_security_questions for select
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- Users may insert their own questions (first-time setup)
create policy "security_questions: insert own"
  on public.user_security_questions for insert
  with check (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- Users may update their own questions
create policy "security_questions: update own"
  on public.user_security_questions for update
  using (
    user_id = (
      select id from public.users
      where firebase_uid = public.firebase_uid()
      limit 1
    )
  );

-- ── RPC: upsert_security_questions ───────────────────────────
-- Called from the frontend to set/update a user's security questions.
-- Hashes answers with bcrypt before storing.
-- Runs as SECURITY DEFINER so RLS is bypassed inside the function.
create or replace function public.upsert_security_questions(
  p_user_id uuid,
  p_q1 text, p_a1 text,
  p_q2 text, p_a2 text,
  p_q3 text, p_a3 text
)
returns void
language plpgsql security definer
as $$
begin
  insert into public.user_security_questions
    (user_id, q1, a1_hash, q2, a2_hash, q3, a3_hash, updated_at)
  values (
    p_user_id,
    p_q1, crypt(lower(trim(p_a1)), gen_salt('bf')),
    p_q2, crypt(lower(trim(p_a2)), gen_salt('bf')),
    p_q3, crypt(lower(trim(p_a3)), gen_salt('bf')),
    now()
  )
  on conflict (user_id) do update set
    q1         = excluded.q1,
    a1_hash    = excluded.a1_hash,
    q2         = excluded.q2,
    a2_hash    = excluded.a2_hash,
    q3         = excluded.q3,
    a3_hash    = excluded.a3_hash,
    updated_at = now();
end;
$$;

-- ── RPC: verify_security_answers ─────────────────────────────
-- Returns true only if all three answers match the stored hashes.
-- Answers are normalised (lower + trim) before comparison.
create or replace function public.verify_security_answers(
  p_user_id uuid,
  p_a1 text,
  p_a2 text,
  p_a3 text
)
returns boolean
language plpgsql security definer
as $$
declare
  v_row public.user_security_questions%rowtype;
begin
  select * into v_row
  from public.user_security_questions
  where user_id = p_user_id
  limit 1;

  if not found then
    return false;
  end if;

  return
    crypt(lower(trim(p_a1)), v_row.a1_hash) = v_row.a1_hash and
    crypt(lower(trim(p_a2)), v_row.a2_hash) = v_row.a2_hash and
    crypt(lower(trim(p_a3)), v_row.a3_hash) = v_row.a3_hash;
end;
$$;
