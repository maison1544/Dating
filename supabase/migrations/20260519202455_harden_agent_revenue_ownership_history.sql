create index if not exists idx_deposit_requests_referral_owner_snapshot
on public.deposit_requests(referral_owner_id_snapshot);

create index if not exists idx_withdrawal_requests_referral_owner_snapshot
on public.withdrawal_requests(referral_owner_id_snapshot);

create index if not exists idx_point_transactions_referral_owner_snapshot
on public.point_transactions(referral_owner_id_snapshot);

create index if not exists idx_game_bets_referral_owner_snapshot
on public.game_bets(referral_owner_id_snapshot);

create index if not exists idx_user_agent_ownership_history_referral_owner
on public.user_agent_ownership_history(referral_owner_id);

create index if not exists idx_user_agent_ownership_history_changed_by
on public.user_agent_ownership_history(changed_by);

drop policy if exists user_agent_ownership_history_select_backoffice on public.user_agent_ownership_history;
create policy user_agent_ownership_history_select_backoffice
on public.user_agent_ownership_history
for select
to authenticated
using ((select private.is_admin()) or agent_id = (select auth.uid()));

drop policy if exists user_agent_ownership_history_admin_insert on public.user_agent_ownership_history;
create policy user_agent_ownership_history_admin_insert
on public.user_agent_ownership_history
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists user_agent_ownership_history_admin_update on public.user_agent_ownership_history;
create policy user_agent_ownership_history_admin_update
on public.user_agent_ownership_history
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function private.apply_deposit_agent_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_should_resolve boolean;
  v_at timestamptz;
begin
  v_should_resolve := new.agent_id_snapshot is null;

  if tg_op = 'UPDATE'
    and old.status is distinct from 'approved'
    and new.status = 'approved'
  then
    v_should_resolve := true;
  end if;

  if v_should_resolve then
    v_at := case
      when new.status = 'approved' then coalesce(new.processed_at, now())
      else coalesce(new.created_at, now())
    end;

    if tg_op = 'UPDATE'
      and old.status is distinct from 'approved'
      and new.status = 'approved'
    then
      new.agent_id_snapshot := null;
      new.agent_code_snapshot := null;
      new.referral_owner_id_snapshot := null;
    end if;

    select p_agent_id, p_agent_code, p_referral_owner_id
    into new.agent_id_snapshot, new.agent_code_snapshot, new.referral_owner_id_snapshot
    from private.set_agent_snapshot_fields(
      new.user_id,
      v_at,
      new.agent_id_snapshot,
      new.agent_code_snapshot,
      new.referral_owner_id_snapshot
    );
  end if;

  return new;
end;
$$;
