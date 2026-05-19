create table if not exists public.user_agent_ownership_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  agent_code varchar,
  referral_owner_id uuid references public.agents(id) on delete set null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  changed_by uuid references public.admins(id) on delete set null,
  source varchar not null default 'system',
  created_at timestamptz default now(),
  constraint user_agent_ownership_valid_range check (valid_to is null or valid_to > valid_from)
);

create unique index if not exists uq_user_agent_ownership_history_start
on public.user_agent_ownership_history(user_id, agent_id, valid_from);

create index if not exists idx_user_agent_ownership_history_user_range
on public.user_agent_ownership_history(user_id, valid_from, valid_to);

create index if not exists idx_user_agent_ownership_history_agent_range
on public.user_agent_ownership_history(agent_id, valid_from, valid_to);

alter table public.user_agent_ownership_history enable row level security;

drop policy if exists user_agent_ownership_history_select_backoffice on public.user_agent_ownership_history;
create policy user_agent_ownership_history_select_backoffice
on public.user_agent_ownership_history
for select
to authenticated
using (private.is_admin() or agent_id = auth.uid());

drop policy if exists user_agent_ownership_history_admin_insert on public.user_agent_ownership_history;
create policy user_agent_ownership_history_admin_insert
on public.user_agent_ownership_history
for insert
to authenticated
with check (private.is_admin());

drop policy if exists user_agent_ownership_history_admin_update on public.user_agent_ownership_history;
create policy user_agent_ownership_history_admin_update
on public.user_agent_ownership_history
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

alter table public.deposit_requests
  add column if not exists agent_id_snapshot uuid references public.agents(id) on delete set null,
  add column if not exists agent_code_snapshot varchar,
  add column if not exists referral_owner_id_snapshot uuid references public.agents(id) on delete set null;

alter table public.withdrawal_requests
  add column if not exists agent_id_snapshot uuid references public.agents(id) on delete set null,
  add column if not exists agent_code_snapshot varchar,
  add column if not exists referral_owner_id_snapshot uuid references public.agents(id) on delete set null;

alter table public.point_transactions
  add column if not exists agent_id_snapshot uuid references public.agents(id) on delete set null,
  add column if not exists agent_code_snapshot varchar,
  add column if not exists referral_owner_id_snapshot uuid references public.agents(id) on delete set null;

alter table public.game_bets
  add column if not exists agent_id_snapshot uuid references public.agents(id) on delete set null,
  add column if not exists agent_code_snapshot varchar,
  add column if not exists referral_owner_id_snapshot uuid references public.agents(id) on delete set null;

create index if not exists idx_deposit_requests_agent_snapshot_created
on public.deposit_requests(agent_id_snapshot, created_at desc);

create index if not exists idx_withdrawal_requests_agent_snapshot_created
on public.withdrawal_requests(agent_id_snapshot, created_at desc);

create index if not exists idx_point_transactions_agent_snapshot_created
on public.point_transactions(agent_id_snapshot, created_at desc);

create index if not exists idx_game_bets_agent_snapshot_created
on public.game_bets(agent_id_snapshot, created_at desc);

create or replace function private.resolve_user_agent_ownership(
  p_user_id uuid,
  p_at timestamptz default now()
)
returns table(agent_id uuid, agent_code varchar, referral_owner_id uuid)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  return query
  select h.agent_id, h.agent_code, coalesce(h.referral_owner_id, h.agent_id)
  from public.user_agent_ownership_history h
  where h.user_id = p_user_id
    and h.agent_id is not null
    and h.valid_from <= coalesce(p_at, now())
    and (h.valid_to is null or coalesce(p_at, now()) < h.valid_to)
  order by h.valid_from desc
  limit 1;

  if found then
    return;
  end if;

  return query
  select up.agent_id, a.referral_code, up.agent_id
  from public.user_profiles up
  join public.agents a on a.id = up.agent_id
  where up.id = p_user_id
    and up.agent_id is not null
    and coalesce(up.agent_assigned_at, up.created_at, '-infinity'::timestamptz) <= coalesce(p_at, now())
  limit 1;
end;
$$;

create or replace function private.set_agent_snapshot_fields(
  p_user_id uuid,
  p_at timestamptz,
  inout p_agent_id uuid,
  inout p_agent_code varchar,
  inout p_referral_owner_id uuid
)
returns record
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_owner record;
begin
  if p_agent_id is not null then
    select a.referral_code into p_agent_code
    from public.agents a
    where a.id = p_agent_id;
    p_referral_owner_id := coalesce(p_referral_owner_id, p_agent_id);
    return;
  end if;

  select * into v_owner
  from private.resolve_user_agent_ownership(p_user_id, coalesce(p_at, now()))
  limit 1;

  if found then
    p_agent_id := v_owner.agent_id;
    p_agent_code := v_owner.agent_code;
    p_referral_owner_id := v_owner.referral_owner_id;
  end if;
end;
$$;

create or replace function private.sync_user_agent_ownership_history()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_effective_at timestamptz;
  v_agent_code varchar;
begin
  if tg_op = 'INSERT' then
    if new.agent_id is null then
      return new;
    end if;

    v_effective_at := coalesce(new.agent_assigned_at, new.created_at, now());
    select referral_code into v_agent_code from public.agents where id = new.agent_id;

    insert into public.user_agent_ownership_history (
      user_id,
      agent_id,
      agent_code,
      referral_owner_id,
      valid_from,
      valid_to,
      source
    ) values (
      new.id,
      new.agent_id,
      v_agent_code,
      new.agent_id,
      v_effective_at,
      null,
      'user_profiles_trigger'
    )
    on conflict (user_id, agent_id, valid_from) do update set
      agent_code = excluded.agent_code,
      referral_owner_id = excluded.referral_owner_id,
      valid_to = null;

    return new;
  end if;

  if old.agent_id is not distinct from new.agent_id then
    return new;
  end if;

  v_effective_at := coalesce(new.agent_assigned_at, now());

  if old.agent_id is not null then
    update public.user_agent_ownership_history h
    set valid_to = v_effective_at
    where h.id = (
      select h2.id
      from public.user_agent_ownership_history h2
      where h2.user_id = new.id
        and h2.agent_id = old.agent_id
        and h2.valid_from <= v_effective_at
        and (h2.valid_to is null or h2.valid_to > v_effective_at)
      order by h2.valid_from desc
      limit 1
    );
  end if;

  if new.agent_id is not null then
    select referral_code into v_agent_code from public.agents where id = new.agent_id;

    insert into public.user_agent_ownership_history (
      user_id,
      agent_id,
      agent_code,
      referral_owner_id,
      valid_from,
      valid_to,
      source
    ) values (
      new.id,
      new.agent_id,
      v_agent_code,
      new.agent_id,
      v_effective_at,
      null,
      'user_profiles_trigger'
    )
    on conflict (user_id, agent_id, valid_from) do update set
      agent_code = excluded.agent_code,
      referral_owner_id = excluded.referral_owner_id,
      valid_to = null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_user_agent_ownership_history on public.user_profiles;
create trigger sync_user_agent_ownership_history
after insert or update of agent_id, agent_assigned_at on public.user_profiles
for each row execute function private.sync_user_agent_ownership_history();

create or replace function private.sync_agent_history_from_admin_log()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid;
  v_from_agent_id uuid;
  v_to_agent_id uuid;
  v_from_assigned_at timestamptz;
  v_to_assigned_at timestamptz;
  v_effective_at timestamptz;
  v_agent_code varchar;
begin
  if new.action <> 'change_user_referral_code' then
    return new;
  end if;

  v_user_id := coalesce(new.target_id, nullif(new.changes->>'userId', '')::uuid);
  v_from_agent_id := nullif(new.changes->>'fromAgentId', '')::uuid;
  v_to_agent_id := nullif(new.changes->>'toAgentId', '')::uuid;
  v_from_assigned_at := nullif(new.changes->>'fromAssignedAt', '')::timestamptz;
  v_to_assigned_at := nullif(new.changes->>'toAssignedAt', '')::timestamptz;
  v_effective_at := coalesce(v_to_assigned_at, new.created_at, now());

  if v_user_id is null then
    return new;
  end if;

  if v_from_agent_id is not null then
    update public.user_agent_ownership_history h
    set valid_to = v_effective_at,
        changed_by = coalesce(h.changed_by, new.admin_id),
        source = 'admin_action_log'
    where h.id = (
      select h2.id
      from public.user_agent_ownership_history h2
      where h2.user_id = v_user_id
        and h2.agent_id = v_from_agent_id
        and h2.valid_from <= v_effective_at
        and (h2.valid_to is null or h2.valid_to > v_effective_at)
      order by h2.valid_from desc
      limit 1
    );
  end if;

  if v_to_agent_id is not null then
    select referral_code into v_agent_code from public.agents where id = v_to_agent_id;

    insert into public.user_agent_ownership_history (
      user_id,
      agent_id,
      agent_code,
      referral_owner_id,
      valid_from,
      valid_to,
      changed_by,
      source
    ) values (
      v_user_id,
      v_to_agent_id,
      v_agent_code,
      v_to_agent_id,
      v_effective_at,
      null,
      new.admin_id,
      'admin_action_log'
    )
    on conflict (user_id, agent_id, valid_from) do update set
      agent_code = excluded.agent_code,
      referral_owner_id = excluded.referral_owner_id,
      changed_by = coalesce(public.user_agent_ownership_history.changed_by, excluded.changed_by),
      source = 'admin_action_log';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_agent_history_from_admin_log on public.admin_action_logs;
create trigger sync_agent_history_from_admin_log
after insert on public.admin_action_logs
for each row execute function private.sync_agent_history_from_admin_log();

create or replace function private.apply_deposit_agent_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.agent_id_snapshot is null then
    select p_agent_id, p_agent_code, p_referral_owner_id
    into new.agent_id_snapshot, new.agent_code_snapshot, new.referral_owner_id_snapshot
    from private.set_agent_snapshot_fields(
      new.user_id,
      coalesce(new.created_at, now()),
      new.agent_id_snapshot,
      new.agent_code_snapshot,
      new.referral_owner_id_snapshot
    );
  end if;

  return new;
end;
$$;

drop trigger if exists apply_deposit_agent_snapshot on public.deposit_requests;
create trigger apply_deposit_agent_snapshot
before insert or update of status, processed_at on public.deposit_requests
for each row execute function private.apply_deposit_agent_snapshot();

create or replace function private.apply_withdrawal_agent_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.agent_id_snapshot is null then
    select p_agent_id, p_agent_code, p_referral_owner_id
    into new.agent_id_snapshot, new.agent_code_snapshot, new.referral_owner_id_snapshot
    from private.set_agent_snapshot_fields(
      new.user_id,
      coalesce(new.created_at, now()),
      new.agent_id_snapshot,
      new.agent_code_snapshot,
      new.referral_owner_id_snapshot
    );
  end if;

  return new;
end;
$$;

drop trigger if exists apply_withdrawal_agent_snapshot on public.withdrawal_requests;
create trigger apply_withdrawal_agent_snapshot
before insert or update of status, processed_at on public.withdrawal_requests
for each row execute function private.apply_withdrawal_agent_snapshot();

create or replace function private.apply_game_bet_agent_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.agent_id_snapshot is null then
    select p_agent_id, p_agent_code, p_referral_owner_id
    into new.agent_id_snapshot, new.agent_code_snapshot, new.referral_owner_id_snapshot
    from private.set_agent_snapshot_fields(
      new.user_id,
      coalesce(new.created_at, now()),
      new.agent_id_snapshot,
      new.agent_code_snapshot,
      new.referral_owner_id_snapshot
    );
  end if;

  return new;
end;
$$;

drop trigger if exists apply_game_bet_agent_snapshot on public.game_bets;
create trigger apply_game_bet_agent_snapshot
before insert or update of status, settled_at on public.game_bets
for each row execute function private.apply_game_bet_agent_snapshot();

create or replace function private.apply_point_transaction_agent_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_related record;
begin
  if new.agent_id_snapshot is not null then
    return new;
  end if;

  if new.related_id is not null and new.type in ('charge', 'bonus') then
    select agent_id_snapshot, agent_code_snapshot, referral_owner_id_snapshot
    into v_related
    from public.deposit_requests
    where id = new.related_id;

    if found and v_related.agent_id_snapshot is not null then
      new.agent_id_snapshot := v_related.agent_id_snapshot;
      new.agent_code_snapshot := v_related.agent_code_snapshot;
      new.referral_owner_id_snapshot := v_related.referral_owner_id_snapshot;
      return new;
    end if;
  end if;

  if new.related_id is not null and new.type in ('withdraw', 'withdraw_pending', 'withdraw_refund', 'withdraw_rollback') then
    select agent_id_snapshot, agent_code_snapshot, referral_owner_id_snapshot
    into v_related
    from public.withdrawal_requests
    where id = new.related_id;

    if found and v_related.agent_id_snapshot is not null then
      new.agent_id_snapshot := v_related.agent_id_snapshot;
      new.agent_code_snapshot := v_related.agent_code_snapshot;
      new.referral_owner_id_snapshot := v_related.referral_owner_id_snapshot;
      return new;
    end if;
  end if;

  if new.related_id is not null and new.related_type = 'game_bets' then
    select agent_id_snapshot, agent_code_snapshot, referral_owner_id_snapshot
    into v_related
    from public.game_bets
    where id = new.related_id;

    if found and v_related.agent_id_snapshot is not null then
      new.agent_id_snapshot := v_related.agent_id_snapshot;
      new.agent_code_snapshot := v_related.agent_code_snapshot;
      new.referral_owner_id_snapshot := v_related.referral_owner_id_snapshot;
      return new;
    end if;
  end if;

  select p_agent_id, p_agent_code, p_referral_owner_id
  into new.agent_id_snapshot, new.agent_code_snapshot, new.referral_owner_id_snapshot
  from private.set_agent_snapshot_fields(
    new.user_id,
    coalesce(new.created_at, now()),
    new.agent_id_snapshot,
    new.agent_code_snapshot,
    new.referral_owner_id_snapshot
  );

  return new;
end;
$$;

drop trigger if exists apply_point_transaction_agent_snapshot on public.point_transactions;
create trigger apply_point_transaction_agent_snapshot
before insert or update of related_id, related_type, type on public.point_transactions
for each row execute function private.apply_point_transaction_agent_snapshot();

do $$
declare
  r record;
  v_user_id uuid;
  v_from_agent_id uuid;
  v_to_agent_id uuid;
  v_from_assigned_at timestamptz;
  v_to_assigned_at timestamptz;
  v_effective_at timestamptz;
  v_agent_code varchar;
begin
  for r in
    select *
    from public.admin_action_logs
    where action = 'change_user_referral_code'
    order by created_at asc
  loop
    v_user_id := coalesce(r.target_id, nullif(r.changes->>'userId', '')::uuid);
    v_from_agent_id := nullif(r.changes->>'fromAgentId', '')::uuid;
    v_to_agent_id := nullif(r.changes->>'toAgentId', '')::uuid;
    v_from_assigned_at := nullif(r.changes->>'fromAssignedAt', '')::timestamptz;
    v_to_assigned_at := nullif(r.changes->>'toAssignedAt', '')::timestamptz;
    v_effective_at := coalesce(v_to_assigned_at, r.created_at, now());

    if v_user_id is null then
      continue;
    end if;

    if v_from_agent_id is not null then
      update public.user_agent_ownership_history h
      set valid_to = v_effective_at,
          changed_by = coalesce(h.changed_by, r.admin_id),
          source = 'admin_action_log_backfill'
      where h.id = (
        select h2.id
        from public.user_agent_ownership_history h2
        where h2.user_id = v_user_id
          and h2.agent_id = v_from_agent_id
          and h2.valid_from <= v_effective_at
          and (h2.valid_to is null or h2.valid_to > v_effective_at)
        order by h2.valid_from desc
        limit 1
      );
    end if;

    if v_to_agent_id is not null then
      select referral_code into v_agent_code from public.agents where id = v_to_agent_id;

      insert into public.user_agent_ownership_history (
        user_id,
        agent_id,
        agent_code,
        referral_owner_id,
        valid_from,
        valid_to,
        changed_by,
        source
      ) values (
        v_user_id,
        v_to_agent_id,
        v_agent_code,
        v_to_agent_id,
        v_effective_at,
        null,
        r.admin_id,
        'admin_action_log_backfill'
      )
      on conflict (user_id, agent_id, valid_from) do update set
        agent_code = excluded.agent_code,
        referral_owner_id = excluded.referral_owner_id,
        changed_by = coalesce(public.user_agent_ownership_history.changed_by, excluded.changed_by),
        source = 'admin_action_log_backfill';
    end if;
  end loop;

  insert into public.user_agent_ownership_history (
    user_id,
    agent_id,
    agent_code,
    referral_owner_id,
    valid_from,
    valid_to,
    source
  )
  select
    up.id,
    up.agent_id,
    a.referral_code,
    up.agent_id,
    coalesce(up.agent_assigned_at, up.created_at, now()),
    null,
    'current_user_profiles_backfill'
  from public.user_profiles up
  join public.agents a on a.id = up.agent_id
  where up.agent_id is not null
    and not exists (
      select 1
      from public.user_agent_ownership_history h
      where h.user_id = up.id
        and h.agent_id = up.agent_id
        and h.valid_to is null
    )
  on conflict (user_id, agent_id, valid_from) do update set
    agent_code = excluded.agent_code,
    referral_owner_id = excluded.referral_owner_id,
    valid_to = null;
end;
$$;

create or replace function private.get_agent_revenue_transactions(
  p_agent_id uuid,
  p_types text[] default array['charge', 'withdraw'],
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar,
  agent_id uuid,
  agent_code varchar,
  source text
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and auth.uid() is distinct from p_agent_id then
    raise exception 'Forbidden';
  end if;

  return query
  with typed_point_transactions as (
    select
      pt.id,
      pt.user_id,
      pt.type,
      pt.amount,
      pt.created_at,
      pt.related_id,
      pt.related_type,
      up.name as user_name,
      up.nickname as user_nickname,
      coalesce(pt.agent_id_snapshot, owner.agent_id) as effective_agent_id,
      coalesce(pt.agent_code_snapshot, owner.agent_code) as effective_agent_code,
      'point_transactions'::text as source
    from public.point_transactions pt
    left join public.user_profiles up on up.id = pt.user_id
    left join lateral private.resolve_user_agent_ownership(pt.user_id, pt.created_at) owner on true
    where pt.type::text = any(coalesce(p_types, array[]::text[]))
      and (p_from is null or pt.created_at >= p_from)
      and (p_to is null or pt.created_at <= p_to)
  ), supplemental_withdrawals as (
    select
      wr.id,
      wr.user_id,
      'withdraw'::varchar as type,
      -abs(wr.amount)::bigint as amount,
      coalesce(wr.processed_at, wr.created_at) as created_at,
      wr.id as related_id,
      'withdrawal_request'::varchar as related_type,
      up.name as user_name,
      up.nickname as user_nickname,
      coalesce(wr.agent_id_snapshot, owner.agent_id) as effective_agent_id,
      coalesce(wr.agent_code_snapshot, owner.agent_code) as effective_agent_code,
      'withdrawal_requests'::text as source
    from public.withdrawal_requests wr
    left join public.user_profiles up on up.id = wr.user_id
    left join lateral private.resolve_user_agent_ownership(wr.user_id, coalesce(wr.processed_at, wr.created_at)) owner on true
    where wr.status = 'approved'
      and 'withdraw' = any(coalesce(p_types, array[]::text[]))
      and (p_from is null or coalesce(wr.processed_at, wr.created_at) >= p_from)
      and (p_to is null or coalesce(wr.processed_at, wr.created_at) <= p_to)
      and not exists (
        select 1
        from public.point_transactions pt
        where pt.related_id = wr.id
          and pt.type = 'withdraw'
      )
  )
  select
    t.id,
    t.user_id,
    t.type,
    t.amount,
    t.created_at,
    t.related_id,
    t.related_type,
    t.user_name,
    t.user_nickname,
    t.effective_agent_id,
    t.effective_agent_code,
    t.source
  from (
    select * from typed_point_transactions
    union all
    select * from supplemental_withdrawals
  ) t
  where t.effective_agent_id = p_agent_id
  order by t.created_at desc;
end;
$$;

create or replace function public.get_agent_revenue_transactions(
  p_agent_id uuid,
  p_types text[] default array['charge', 'withdraw'],
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar,
  agent_id uuid,
  agent_code varchar,
  source text
)
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and auth.uid() is distinct from p_agent_id then
    raise exception 'Forbidden';
  end if;

  return query select * from private.get_agent_revenue_transactions(p_agent_id, p_types, p_from, p_to);
end;
$$;

create or replace function private.get_agent_member_transactions(p_member_ids uuid[], p_types text[])
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and not private.is_agent() then
    raise exception 'Forbidden';
  end if;

  return query
  select pt.id, pt.user_id, pt.type, pt.amount, pt.created_at, pt.related_id, pt.related_type, up.name, up.nickname
  from public.point_transactions pt
  left join public.user_profiles up on up.id = pt.user_id
  left join lateral private.resolve_user_agent_ownership(pt.user_id, pt.created_at) owner on true
  where pt.user_id = any(coalesce(p_member_ids, array[]::uuid[]))
    and pt.type::text = any(coalesce(p_types, array[]::text[]))
    and (
      private.is_service_role()
      or private.is_admin()
      or coalesce(pt.agent_id_snapshot, owner.agent_id) = auth.uid()
    )
  order by pt.created_at desc;
end;
$$;

create or replace function public.get_agent_member_transactions(p_member_ids uuid[], p_types text[])
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar
)
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and not private.is_agent() then
    raise exception 'Forbidden';
  end if;

  return query select * from private.get_agent_member_transactions(p_member_ids, p_types);
end;
$$;

revoke execute on function public.get_agent_revenue_transactions(uuid, text[], timestamptz, timestamptz) from public, anon;
grant execute on function public.get_agent_revenue_transactions(uuid, text[], timestamptz, timestamptz) to authenticated;

grant execute on function private.get_agent_revenue_transactions(uuid, text[], timestamptz, timestamptz) to authenticated, service_role;
grant execute on function private.resolve_user_agent_ownership(uuid, timestamptz) to authenticated, service_role;
