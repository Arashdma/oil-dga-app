create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  mobile text not null unique,
  first_name text not null,
  last_name text not null,
  company_name text not null,
  analysis_count integer not null default 0,
  is_pro boolean not null default false,
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
  deleted_at timestamptz,
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
add column if not exists deleted_at timestamptz;

alter table public.projects
add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
add column if not exists analysis_count integer not null default 0;

alter table public.profiles
add column if not exists is_pro boolean not null default false;

update public.profiles p
set analysis_count = counts.analysis_count
from (
  select user_id, count(*)::integer as analysis_count
  from public.analyses
  group by user_id
) counts
where counts.user_id = p.id
  and coalesce(p.analysis_count, 0) <> counts.analysis_count;

create table if not exists public.app_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value_json)
values ('free_analysis_limit', jsonb_build_object('value', 30))
on conflict (key) do nothing;

drop index if exists projects_user_transformer_unique;

create unique index if not exists projects_user_transformer_unique
on public.projects (user_id, company_name, station_name, transformer_number)
where archived_at is null and deleted_at is null;

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.projects enable row level security;
alter table public.app_settings enable row level security;

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

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and mobile in ('09366183493', '09126125786')
  );
$$;

grant execute on function public.is_admin_user() to authenticated;

create or replace function public.get_admin_user_activity()
returns table (
  user_id uuid,
  mobile text,
  first_name text,
  last_name text,
  company_name text,
  is_pro boolean,
  created_at timestamptz,
  project_count bigint,
  analysis_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.mobile,
    p.first_name,
    p.last_name,
    p.company_name,
    p.is_pro,
    p.created_at,
    count(distinct pr.id) as project_count,
    p.analysis_count
  from public.profiles p
  left join public.projects pr on pr.user_id = p.id and pr.archived_at is null and pr.deleted_at is null
  where public.is_admin_user()
  group by p.id, p.mobile, p.first_name, p.last_name, p.company_name, p.is_pro, p.created_at, p.analysis_count
  order by p.created_at desc;
$$;

grant execute on function public.get_admin_user_activity() to authenticated;

create or replace function public.get_free_analysis_limit()
returns integer
language sql
security definer
set search_path = public
as $$
  select greatest(
    coalesce((select (value_json ->> 'value')::integer from public.app_settings where key = 'free_analysis_limit'), 30),
    0
  );
$$;

grant execute on function public.get_free_analysis_limit() to authenticated;

create or replace function public.get_analysis_usage_status()
returns table (
  is_pro boolean,
  analysis_count integer,
  free_limit integer,
  remaining integer,
  limit_reached boolean
)
language sql
security definer
set search_path = public
as $$
  with profile_data as (
    select
      coalesce(p.is_pro, false) as is_pro,
      coalesce(p.analysis_count, 0) as analysis_count
    from public.profiles p
    where p.id = auth.uid()
  ),
  limit_data as (
    select public.get_free_analysis_limit() as free_limit
  )
  select
    profile_data.is_pro,
    profile_data.analysis_count,
    limit_data.free_limit,
    greatest(limit_data.free_limit - profile_data.analysis_count, 0) as remaining,
    (not profile_data.is_pro and profile_data.analysis_count >= limit_data.free_limit) as limit_reached
  from profile_data
  cross join limit_data;
$$;

grant execute on function public.get_analysis_usage_status() to authenticated;

create or replace function public.save_analysis_with_limit(
  p_project_id bigint,
  p_input jsonb,
  p_result jsonb,
  p_final_diagnosis text,
  p_confidence text,
  p_tdcg numeric,
  p_sampled_at timestamptz default null,
  p_notes text default null
)
returns table (
  saved boolean,
  analysis_id bigint,
  is_pro boolean,
  analysis_count integer,
  free_limit integer,
  remaining integer,
  limit_reached boolean,
  error_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_record public.profiles%rowtype;
  project_owner_id uuid;
  current_limit integer;
  inserted_analysis_id bigint;
  next_analysis_count integer;
begin
  if auth.uid() is null then
    return query
    select false, null::bigint, false, 0, public.get_free_analysis_limit(), 0, true, 'AUTH_REQUIRED';
    return;
  end if;

  select *
  into profile_record
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    return query
    select false, null::bigint, false, 0, public.get_free_analysis_limit(), 0, true, 'PROFILE_NOT_FOUND';
    return;
  end if;

  current_limit := public.get_free_analysis_limit();

  select user_id
  into project_owner_id
  from public.projects
  where id = p_project_id
    and archived_at is null
    and deleted_at is null;

  if project_owner_id is null or project_owner_id <> auth.uid() then
    return query
    select
      false,
      null::bigint,
      coalesce(profile_record.is_pro, false),
      coalesce(profile_record.analysis_count, 0),
      current_limit,
      greatest(current_limit - coalesce(profile_record.analysis_count, 0), 0),
      (not coalesce(profile_record.is_pro, false) and coalesce(profile_record.analysis_count, 0) >= current_limit),
      'PROJECT_NOT_FOUND';
    return;
  end if;

  if not coalesce(profile_record.is_pro, false) and coalesce(profile_record.analysis_count, 0) >= current_limit then
    return query
    select
      false,
      null::bigint,
      false,
      coalesce(profile_record.analysis_count, 0),
      current_limit,
      0,
      true,
      'FREE_LIMIT_REACHED';
    return;
  end if;

  insert into public.analyses (
    user_id,
    project_id,
    input,
    result,
    final_diagnosis,
    confidence,
    tdcg,
    sampled_at,
    notes
  ) values (
    auth.uid(),
    p_project_id,
    p_input,
    p_result,
    p_final_diagnosis,
    p_confidence,
    p_tdcg,
    p_sampled_at,
    p_notes
  )
  returning id into inserted_analysis_id;

  update public.profiles
  set analysis_count = coalesce(analysis_count, 0) + 1
  where id = auth.uid()
  returning analysis_count into next_analysis_count;

  return query
  select
    true,
    inserted_analysis_id,
    coalesce(profile_record.is_pro, false),
    next_analysis_count,
    current_limit,
    greatest(current_limit - next_analysis_count, 0),
    (not coalesce(profile_record.is_pro, false) and next_analysis_count >= current_limit),
    null::text;
end;
$$;

grant execute on function public.save_analysis_with_limit(bigint, jsonb, jsonb, text, text, numeric, timestamptz, text) to authenticated;

create or replace function public.get_admin_usage_settings()
returns table (
  free_limit integer
)
language sql
security definer
set search_path = public
as $$
  select public.get_free_analysis_limit()
  where public.is_admin_user();
$$;

grant execute on function public.get_admin_usage_settings() to authenticated;

create or replace function public.admin_set_free_analysis_limit(p_limit integer)
returns table (
  free_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'ADMIN_ONLY';
  end if;

  if p_limit is null or p_limit < 0 then
    raise exception 'INVALID_FREE_LIMIT';
  end if;

  insert into public.app_settings (key, value_json, updated_at)
  values ('free_analysis_limit', jsonb_build_object('value', p_limit), now())
  on conflict (key)
  do update set
    value_json = excluded.value_json,
    updated_at = now();

  return query select p_limit;
end;
$$;

grant execute on function public.admin_set_free_analysis_limit(integer) to authenticated;

create or replace function public.admin_set_user_pro_status(
  p_user_id uuid,
  p_is_pro boolean
)
returns table (
  user_id uuid,
  is_pro boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'ADMIN_ONLY';
  end if;

  update public.profiles
  set is_pro = coalesce(p_is_pro, false)
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  return query
  select p_user_id, coalesce(p_is_pro, false);
end;
$$;

grant execute on function public.admin_set_user_pro_status(uuid, boolean) to authenticated;
