revoke execute on function public.admin_force_process_round(uuid, jsonb) from anon;
revoke execute on function public.check_session_valid() from anon;
revoke execute on function public.game_tick() from anon;
revoke execute on function public.get_agent_member_transactions(uuid[], text[]) from anon;
revoke execute on function public.get_agent_referral_code_logs(uuid) from anon;
revoke execute on function public.heartbeat_session() from anon;
revoke execute on function public.place_bet(uuid, uuid, text, integer, numeric) from anon;

revoke execute on function public.game_tick() from authenticated;
revoke execute on function public.game_tick() from public;

drop policy if exists deposit_requests_insert_own_pending on public.deposit_requests;
drop policy if exists withdrawal_requests_insert_own_pending on public.withdrawal_requests;
create policy withdrawal_requests_insert_own_pending
on public.withdrawal_requests
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and processed_by is null
  and processed_at is null
);

drop policy if exists notices_manage_admins on public.notices;
drop policy if exists notices_insert_admins on public.notices;
drop policy if exists notices_update_admins on public.notices;
drop policy if exists notices_delete_admins on public.notices;
drop policy if exists notices_select_published on public.notices;

create policy notices_select_published
on public.notices
for select
to public
using (coalesce(is_published, true) = true or private.is_admin());

create policy notices_insert_admins
on public.notices
for insert
to authenticated
with check (private.is_admin());

create policy notices_update_admins
on public.notices
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy notices_delete_admins
on public.notices
for delete
to authenticated
using (private.is_admin());
