revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_super_admin() from anon, authenticated;
revoke execute on function public.is_agent() from anon, authenticated;
revoke execute on function public.update_admin_last_active() from anon, authenticated;
revoke execute on function public.check_user_profile_self_update_allowed(
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
) from anon, authenticated;
revoke execute on function public.get_session_timeout(text) from anon;
grant execute on function public.get_session_timeout(text) to authenticated;

drop policy if exists "admins_select_self" on public.admins;
drop policy if exists "admins_select_admins" on public.admins;
drop policy if exists "admins_manage_super_admins" on public.admins;
create policy "admins_select" on public.admins
for select using ((select auth.uid()) = id or public.is_admin());
create policy "admins_manage_super_admins" on public.admins
for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "agents_select_self" on public.agents;
drop policy if exists "agents_update_self" on public.agents;
drop policy if exists "agents_manage_admins" on public.agents;
create policy "agents_select" on public.agents
for select using ((select auth.uid()) = id or public.is_admin());
create policy "agents_update" on public.agents
for update using ((select auth.uid()) = id or public.is_admin()) with check ((select auth.uid()) = id or public.is_admin());
create policy "agents_insert_delete_admins" on public.agents
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_profiles_select_self" on public.user_profiles;
drop policy if exists "user_profiles_insert_self" on public.user_profiles;
drop policy if exists "user_profiles_update_self_limited" on public.user_profiles;
drop policy if exists "user_profiles_select_admins" on public.user_profiles;
drop policy if exists "user_profiles_update_admins" on public.user_profiles;
drop policy if exists "user_profiles_select_assigned_agents" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles
for select using (
  (select auth.uid()) = id
  or public.is_admin()
  or (agent_id = (select auth.uid()) and public.is_agent())
);
create policy "user_profiles_insert_self" on public.user_profiles
for insert with check ((select auth.uid()) = id);
create policy "user_profiles_update" on public.user_profiles
for update using (
  public.is_admin()
  or (select auth.uid()) = id
) with check (
  public.is_admin()
  or (
    (select auth.uid()) = id and
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
  )
);

drop policy if exists "login_logs_select_self" on public.login_logs;
drop policy if exists "login_logs_select_admins" on public.login_logs;
drop policy if exists "login_logs_insert_authenticated" on public.login_logs;
create policy "login_logs_select" on public.login_logs
for select using ((select auth.uid()) = user_id or public.is_admin());
create policy "login_logs_insert_authenticated" on public.login_logs
for insert with check ((select auth.uid()) = user_id or public.is_admin());
