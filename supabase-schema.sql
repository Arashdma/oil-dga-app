create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  mobile text not null unique,
  first_name text not null,
  last_name text not null,
  company_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  final_diagnosis text not null,
  confidence text not null,
  tdcg numeric not null,
  hidden_from_user_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.analyses
add column if not exists hidden_from_user_at timestamptz;

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own"
on public.analyses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "analyses_insert_own" on public.analyses;
create policy "analyses_insert_own"
on public.analyses
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "analyses_update_own" on public.analyses;
create policy "analyses_update_own"
on public.analyses
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
