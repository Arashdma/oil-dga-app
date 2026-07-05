create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  mobile text not null unique,
  first_name text not null,
  last_name text not null,
  company_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  station_name text not null,
  transformer_number text not null,
  voltage_kv numeric,
  capacity_mva numeric,
  manufacturer text,
  manufactured_year integer,
  extra_attributes jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id bigint references public.projects (id) on delete restrict,
  input jsonb not null,
  result jsonb not null,
  final_diagnosis text not null,
  confidence text not null,
  tdcg numeric not null,
  sampled_at timestamptz,
  notes text,
  hidden_from_user_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.analyses
add column if not exists hidden_from_user_at timestamptz;

alter table public.analyses
add column if not exists project_id bigint references public.projects (id) on delete restrict;

alter table public.analyses
add column if not exists sampled_at timestamptz;

alter table public.analyses
add column if not exists notes text;

alter table public.projects
add column if not exists extra_attributes jsonb not null default '{}'::jsonb;

alter table public.projects
add column if not exists archived_at timestamptz;

alter table public.projects
add column if not exists updated_at timestamptz not null default now();

create unique index if not exists projects_user_transformer_unique
on public.projects (user_id, company_name, station_name, transformer_number);

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.projects enable row level security;

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

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (auth.uid() = user_id);
