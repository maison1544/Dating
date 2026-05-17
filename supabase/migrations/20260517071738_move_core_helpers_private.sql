create schema if not exists private;

create or replace function private.is_admin()
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

create or replace function private.is_super_admin()
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

create or replace function private.is_agent()
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

create or replace function private.check_user_profile_self_update_allowed(
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

grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function private.is_agent() to anon, authenticated;
grant execute on function private.check_user_profile_self_update_allowed(
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
) to anon, authenticated;

alter function public.get_session_timeout(text) security invoker;
revoke execute on function public.get_session_timeout(text) from anon;
grant execute on function public.get_session_timeout(text) to authenticated;

drop policy if exists "admins_select" on public.admins;
drop policy if exists "admins_manage_super_admins" on public.admins;
create policy "admins_select" on public.admins
for select using ((select auth.uid()) = id or private.is_admin());
create policy "admins_insert_super_admins" on public.admins
for insert with check (private.is_super_admin());
create policy "admins_update_super_admins" on public.admins
for update using (private.is_super_admin()) with check (private.is_super_admin());
create policy "admins_delete_super_admins" on public.admins
for delete using (private.is_super_admin());

drop policy if exists "agents_select" on public.agents;
drop policy if exists "agents_update" on public.agents;
drop policy if exists "agents_insert_delete_admins" on public.agents;
create policy "agents_select" on public.agents
for select using ((select auth.uid()) = id or private.is_admin());
create policy "agents_update" on public.agents
for update using ((select auth.uid()) = id or private.is_admin()) with check ((select auth.uid()) = id or private.is_admin());
create policy "agents_insert_admins" on public.agents
for insert with check (private.is_admin());
create policy "agents_delete_admins" on public.agents
for delete using (private.is_admin());

drop policy if exists "user_profiles_select" on public.user_profiles;
drop policy if exists "user_profiles_insert_self" on public.user_profiles;
drop policy if exists "user_profiles_update" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles
for select using (
  (select auth.uid()) = id
  or private.is_admin()
  or (agent_id = (select auth.uid()) and private.is_agent())
);
create policy "user_profiles_insert_self" on public.user_profiles
for insert with check ((select auth.uid()) = id);
create policy "user_profiles_update" on public.user_profiles
for update using (
  private.is_admin()
  or (select auth.uid()) = id
) with check (
  private.is_admin()
  or (
    (select auth.uid()) = id and
    private.check_user_profile_self_update_allowed(
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
  )
);

drop policy if exists "system_settings_insert_admins" on public.system_settings;
drop policy if exists "system_settings_update_admins" on public.system_settings;
create policy "system_settings_insert_admins" on public.system_settings
for insert with check (private.is_admin());
create policy "system_settings_update_admins" on public.system_settings
for update using (private.is_admin()) with check (private.is_admin());

drop policy if exists "login_logs_select" on public.login_logs;
drop policy if exists "login_logs_insert_authenticated" on public.login_logs;
create policy "login_logs_select" on public.login_logs
for select using ((select auth.uid()) = user_id or private.is_admin());
create policy "login_logs_insert_authenticated" on public.login_logs
for insert with check ((select auth.uid()) = user_id or private.is_admin());

drop policy if exists "admin_action_logs_select_admins" on public.admin_action_logs;
drop policy if exists "admin_action_logs_insert_admins" on public.admin_action_logs;
create policy "admin_action_logs_select_admins" on public.admin_action_logs
for select using (private.is_admin());
create policy "admin_action_logs_insert_admins" on public.admin_action_logs
for insert with check (private.is_admin());

drop function if exists public.is_admin();
drop function if exists public.is_super_admin();
drop function if exists public.is_agent();
drop function if exists public.update_admin_last_active();
drop function if exists public.check_user_profile_self_update_allowed(
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
);
