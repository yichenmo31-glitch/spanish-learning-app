-- =============================================================================
-- Alma – Supabase schema
-- Run this once in your Supabase project:  SQL Editor -> New query -> paste -> Run
-- =============================================================================

-- 1. Profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  level      text not null default 'Beginner',
  goal       text not null default 'Daily Conversation',
  coach      text not null default 'alma',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-owned" on public.profiles;
create policy "profiles are self-owned"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Sessions (learning history) ---------------------------------------------
create table if not exists public.sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  session_id     text not null,
  date           timestamptz not null default now(),
  level          text,
  goal           text,
  coach          text,
  duration       text,
  overview       text,
  transcript     jsonb default '[]'::jsonb,
  vocabulary     jsonb default '[]'::jsonb,
  grammar_points jsonb default '[]'::jsonb,
  feedback       jsonb default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists sessions_user_id_date_idx
  on public.sessions (user_id, date desc);

alter table public.sessions enable row level security;

drop policy if exists "sessions are self-owned" on public.sessions;
create policy "sessions are self-owned"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Vocabulary (notebook) ---------------------------------------------------
create table if not exists public.vocabulary (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  word                text not null,
  translation         text,
  example             text,
  example_translation text,
  pronunciation       text,
  created_at          timestamptz not null default now(),
  unique (user_id, word)
);

create index if not exists vocabulary_user_id_created_idx
  on public.vocabulary (user_id, created_at desc);

alter table public.vocabulary enable row level security;

drop policy if exists "vocabulary is self-owned" on public.vocabulary;
create policy "vocabulary is self-owned"
  on public.vocabulary
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
