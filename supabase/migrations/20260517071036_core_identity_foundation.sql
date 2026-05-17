create extension if not exists pgcrypto;

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar not null unique,
  name varchar not null,
  role varchar not null default 'admin' check (role in ('super_admin', 'admin', 'moderator')),
  is_active boolean default true,
  last_login_at timestamptz,
  last_login_ip varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_active_at timestamptz default now()
);

create table public.agents (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar not null unique,
  name varchar not null,
  referral_code varchar not null unique,
  is_active boolean default true,
  last_login_at timestamptz,
  last_login_ip varchar,
  total_gift_revenue bigint default 0,
  total_game_revenue bigint default 0,
  total_revenue bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  assigned_profile_ids uuid[] default '{}'::uuid[],
  last_active_at timestamptz default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar not null,
  name varchar not null,
  nickname varchar not null,
  phone varchar,
  profile_image varchar,
  points bigint not null default 0,
  total_deposited bigint not null default 0,
  total_withdrawn bigint not null default 0,
  status varchar not null default 'pending' check (status in ('pending', 'active', 'suspended', 'deleted', 'rejected')),
  join_ip varchar,
  last_login_ip varchar,
  last_login_at timestamptz,
  bank varchar,
  account_number varchar,
  account_holder varchar,
  agent_id uuid references public.agents(id) on delete set null,
  is_online boolean default false,
  last_activity timestamptz,
  gift_inventory_count integer default 0,
  gift_inventory_value bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  agent_assigned_at timestamptz,
  last_active_at timestamptz default now()
);

create table public.system_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz default now()
);

create table public.login_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_type varchar check (user_type in ('user', 'admin', 'agent')),
  ip_address varchar not null,
  user_agent text,
  device_info jsonb default '{}'::jsonb,
  login_status varchar default 'success' check (login_status in ('success', 'failed', 'blocked')),
  failure_reason text,
  created_at timestamptz default now()
);

create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id),
  action varchar not null,
  target_type varchar,
  target_id uuid,
  changes jsonb,
  ip_address varchar,
  created_at timestamptz default now()
);

create index idx_user_profiles_email on public.user_profiles(email);
create index idx_user_profiles_status on public.user_profiles(status);
create index idx_user_profiles_agent_id on public.user_profiles(agent_id);
create index idx_user_profiles_last_active_at on public.user_profiles(last_active_at);
create index idx_agents_referral_code on public.agents(referral_code);
create index idx_login_logs_user on public.login_logs(user_id);
create index idx_login_logs_created on public.login_logs(created_at desc);
create index idx_admin_action_logs_admin on public.admin_action_logs(admin_id);
create index idx_admin_action_logs_created on public.admin_action_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger admins_set_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

create trigger agents_set_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and coalesce(a.is_active, true) = true
  );
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and a.role = 'super_admin'
      and coalesce(a.is_active, true) = true
  );
end;
$$;

create or replace function public.is_agent()
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.agents a
    where a.id = auth.uid()
      and coalesce(a.is_active, true) = true
  );
end;
$$;

create or replace function public.get_session_timeout(p_role text default 'user')
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value::integer from public.system_settings where key = 'session_timeout_' || p_role),
    30
  );
$$;

create or replace function public.update_admin_last_active()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admins
  set last_active_at = now()
  where id = auth.uid();

  if not found then
    update public.agents
    set last_active_at = now()
    where id = auth.uid();
  end if;
end;
$$;

create or replace function public.check_user_profile_self_update_allowed(
  user_id uuid,
  new_email text,
  new_name text,
  new_nickname text,
  new_phone text,
  new_points bigint,
  new_total_deposited bigint,
  new_total_withdrawn bigint,
  new_status text,
  new_join_ip text,
  new_last_login_ip text,
  new_last_login_at timestamptz,
  new_bank text,
  new_account_number text,
  new_account_holder text,
  new_agent_id uuid,
  new_gift_inventory_count integer,
  new_gift_inventory_value bigint,
  new_deleted_at timestamptz,
  new_agent_assigned_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  current_record record;
begin
  select
    email,
    name,
    nickname,
    phone,
    points,
    total_deposited,
    total_withdrawn,
    status,
    join_ip,
    last_login_ip,
    last_login_at,
    bank,
    account_number,
    account_holder,
    agent_id,
    gift_inventory_count,
    gift_inventory_value,
    deleted_at,
    agent_assigned_at
  into current_record
  from public.user_profiles
  where id = user_id;

  if not found then
    return false;
  end if;

  return (
    new_email is not distinct from current_record.email and
    new_name is not distinct from current_record.name and
    new_nickname is not distinct from current_record.nickname and
    new_phone is not distinct from current_record.phone and
    new_points is not distinct from current_record.points and
    new_total_deposited is not distinct from current_record.total_deposited and
    new_total_withdrawn is not distinct from current_record.total_withdrawn and
    new_status is not distinct from current_record.status and
    new_join_ip is not distinct from current_record.join_ip and
    new_last_login_ip is not distinct from current_record.last_login_ip and
    new_last_login_at is not distinct from current_record.last_login_at and
    new_bank is not distinct from current_record.bank and
    new_account_number is not distinct from current_record.account_number and
    new_account_holder is not distinct from current_record.account_holder and
    new_agent_id is not distinct from current_record.agent_id and
    new_gift_inventory_count is not distinct from current_record.gift_inventory_count and
    new_gift_inventory_value is not distinct from current_record.gift_inventory_value and
    new_deleted_at is not distinct from current_record.deleted_at and
    new_agent_assigned_at is not distinct from current_record.agent_assigned_at
  );
end;
$$;

alter table public.admins enable row level security;
alter table public.agents enable row level security;
alter table public.user_profiles enable row level security;
alter table public.system_settings enable row level security;
alter table public.login_logs enable row level security;
alter table public.admin_action_logs enable row level security;

create policy "admins_select_self" on public.admins
for select using (auth.uid() = id);

create policy "admins_select_admins" on public.admins
for select using (public.is_admin());

create policy "admins_manage_super_admins" on public.admins
for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "agents_select_self" on public.agents
for select using (auth.uid() = id);

create policy "agents_update_self" on public.agents
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "agents_manage_admins" on public.agents
for all using (public.is_admin()) with check (public.is_admin());

create policy "user_profiles_select_self" on public.user_profiles
for select using (auth.uid() = id);

create policy "user_profiles_insert_self" on public.user_profiles
for insert with check (auth.uid() = id);

create policy "user_profiles_update_self_limited" on public.user_profiles
for update using (auth.uid() = id) with check (
  auth.uid() = id and
  public.check_user_profile_self_update_allowed(
    id,
    email::text,
    name::text,
    nickname::text,
    phone::text,
    points,
    total_deposited,
    total_withdrawn,
    status::text,
    join_ip::text,
    last_login_ip::text,
    last_login_at,
    bank::text,
    account_number::text,
    account_holder::text,
    agent_id,
    gift_inventory_count,
    gift_inventory_value,
    deleted_at,
    agent_assigned_at
  )
);

create policy "user_profiles_select_admins" on public.user_profiles
for select using (public.is_admin());

create policy "user_profiles_update_admins" on public.user_profiles
for update using (public.is_admin()) with check (public.is_admin());

create policy "user_profiles_select_assigned_agents" on public.user_profiles
for select using (agent_id = auth.uid() and public.is_agent());

create policy "system_settings_select_all" on public.system_settings
for select using (true);

create policy "system_settings_insert_admins" on public.system_settings
for insert with check (public.is_admin());

create policy "system_settings_update_admins" on public.system_settings
for update using (public.is_admin()) with check (public.is_admin());

create policy "login_logs_select_self" on public.login_logs
for select using (auth.uid() = user_id);

create policy "login_logs_select_admins" on public.login_logs
for select using (public.is_admin());

create policy "login_logs_insert_authenticated" on public.login_logs
for insert with check (auth.uid() = user_id or public.is_admin());

create policy "admin_action_logs_select_admins" on public.admin_action_logs
for select using (public.is_admin());

create policy "admin_action_logs_insert_admins" on public.admin_action_logs
for insert with check (public.is_admin());

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_agent() to anon, authenticated;
grant execute on function public.get_session_timeout(text) to anon, authenticated;
grant execute on function public.update_admin_last_active() to authenticated;
grant execute on function public.check_user_profile_self_update_allowed(
  uuid,
  text,
  text,
  text,
  text,
  bigint,
  bigint,
  bigint,
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  text,
  uuid,
  integer,
  bigint,
  timestamptz,
  timestamptz
) to authenticated;

insert into public.system_settings (key, value, description)
values
  ('session_timeout_user', '30', 'User session timeout in minutes'),
  ('session_timeout_admin', '60', 'Admin session timeout in minutes'),
  ('session_timeout_agent', '60', 'Agent session timeout in minutes')
on conflict (key) do nothing;
