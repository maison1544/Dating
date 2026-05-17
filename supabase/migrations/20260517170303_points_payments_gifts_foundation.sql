create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type varchar not null check (type in (
    'deposit',
    'charge',
    'withdrawal',
    'withdraw',
    'withdraw_pending',
    'withdraw_refund',
    'withdraw_rollback',
    'bet',
    'win',
    'lose',
    'gift_send',
    'gift_receive',
    'gift_buy',
    'gift_sell',
    'gift_reclaim',
    'gift_sell_rollback',
    'chat',
    'chat_start',
    'refund',
    'admin_adjust',
    'bonus'
  )),
  amount bigint not null,
  balance_before bigint,
  balance_after bigint,
  description varchar,
  related_type varchar,
  related_id uuid,
  admin_id uuid references public.admins(id) on delete set null,
  created_at timestamptz default now()
);

create table public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  bonus_amount bigint default 0 check (bonus_amount is null or bonus_amount >= 0),
  status varchar not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  depositor_name varchar,
  processed_by uuid references public.admins(id) on delete set null,
  processed_at timestamptz,
  reject_reason text,
  created_at timestamptz default now()
);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  bank varchar not null,
  account_number varchar not null,
  account_holder varchar not null,
  status varchar not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  processed_by uuid references public.admins(id) on delete set null,
  processed_at timestamptz,
  reject_reason text,
  created_at timestamptz default now()
);

create table public.charging_cards (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  amount bigint not null check (amount > 0),
  bonus_amount bigint default 0 check (bonus_amount is null or bonus_amount >= 0),
  total_amount bigint generated always as (amount + coalesce(bonus_amount, 0)) stored,
  display_order integer default 0,
  is_active boolean default true,
  created_by uuid default auth.uid() references public.admins(id) on delete set null,
  created_at timestamptz default now()
);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  description text,
  emoji varchar,
  buy_price integer not null check (buy_price >= 0),
  sell_price integer not null check (sell_price >= 0),
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.gift_inventory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  gift_id uuid not null references public.gifts(id) on delete cascade,
  quantity integer not null default 1 check (quantity >= 0),
  acquired_at timestamptz default now(),
  owner_type text not null default 'user' check (owner_type in ('user', 'agent')),
  unique (owner_id, gift_id, owner_type)
);

create table public.gift_transactions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete restrict,
  sender_id uuid not null,
  sender_type varchar not null check (sender_type in ('user', 'agent', 'admin', 'system', 'profile')),
  receiver_id uuid not null,
  receiver_type varchar not null check (receiver_type in ('user', 'agent', 'admin', 'system', 'profile')),
  room_id uuid,
  points_amount integer not null,
  quantity integer default 1 check (quantity is null or quantity > 0),
  agent_id uuid references public.agents(id) on delete set null,
  agent_revenue bigint default 0,
  transaction_type varchar default 'send',
  admin_id uuid references public.admins(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_point_transactions_user_created on public.point_transactions(user_id, created_at desc);
create index idx_point_transactions_related on public.point_transactions(related_type, related_id);
create index idx_deposit_requests_user_created on public.deposit_requests(user_id, created_at desc);
create index idx_deposit_requests_status_created on public.deposit_requests(status, created_at desc);
create index idx_withdrawal_requests_user_created on public.withdrawal_requests(user_id, created_at desc);
create index idx_withdrawal_requests_status_created on public.withdrawal_requests(status, created_at desc);
create index idx_charging_cards_active_amount on public.charging_cards(is_active, amount, display_order);
create index idx_gifts_active_order on public.gifts(is_active, display_order, buy_price);
create index idx_gift_inventory_owner on public.gift_inventory(owner_id, owner_type);
create index idx_gift_transactions_sender_created on public.gift_transactions(sender_id, sender_type, created_at desc);
create index idx_gift_transactions_receiver_created on public.gift_transactions(receiver_id, receiver_type, created_at desc);
create index idx_gift_transactions_agent_created on public.gift_transactions(agent_id, created_at desc);

alter table public.point_transactions enable row level security;
alter table public.deposit_requests enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.charging_cards enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_inventory enable row level security;
alter table public.gift_transactions enable row level security;

create policy "point_transactions_select" on public.point_transactions
for select using ((select auth.uid()) = user_id or private.is_admin());
create policy "point_transactions_insert_admins" on public.point_transactions
for insert with check (private.is_admin());

create policy "deposit_requests_select" on public.deposit_requests
for select using ((select auth.uid()) = user_id or private.is_admin());
create policy "deposit_requests_insert_self" on public.deposit_requests
for insert with check ((select auth.uid()) = user_id and status = 'pending' and processed_by is null and processed_at is null);
create policy "deposit_requests_update_admins" on public.deposit_requests
for update using (private.is_admin()) with check (private.is_admin());

create policy "withdrawal_requests_select" on public.withdrawal_requests
for select using ((select auth.uid()) = user_id or private.is_admin());
create policy "withdrawal_requests_update_admins" on public.withdrawal_requests
for update using (private.is_admin()) with check (private.is_admin());

create policy "charging_cards_select" on public.charging_cards
for select using (coalesce(is_active, true) = true or private.is_admin());
create policy "charging_cards_insert_admins" on public.charging_cards
for insert with check (private.is_admin());
create policy "charging_cards_update_admins" on public.charging_cards
for update using (private.is_admin()) with check (private.is_admin());
create policy "charging_cards_delete_admins" on public.charging_cards
for delete using (private.is_admin());

create policy "gifts_select" on public.gifts
for select using (coalesce(is_active, true) = true or private.is_admin());
create policy "gifts_insert_admins" on public.gifts
for insert with check (private.is_admin());
create policy "gifts_update_admins" on public.gifts
for update using (private.is_admin()) with check (private.is_admin());
create policy "gifts_delete_admins" on public.gifts
for delete using (private.is_admin());

create policy "gift_inventory_select" on public.gift_inventory
for select using ((select auth.uid()) = owner_id or private.is_admin());
create policy "gift_inventory_update_admins" on public.gift_inventory
for update using (private.is_admin()) with check (private.is_admin());
create policy "gift_inventory_delete_admins" on public.gift_inventory
for delete using (private.is_admin());

create policy "gift_transactions_select" on public.gift_transactions
for select using (
  private.is_admin()
  or (sender_type in ('user', 'agent') and sender_id = (select auth.uid()))
  or (receiver_type in ('user', 'agent') and receiver_id = (select auth.uid()))
  or (agent_id = (select auth.uid()))
);

create or replace function private.is_service_role()
returns boolean
language sql
security invoker
set search_path = public
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function private.add_points(
  p_user_id uuid,
  p_amount bigint,
  p_type varchar,
  p_reference_id uuid default null,
  p_description text default null,
  p_admin_id uuid default null,
  p_related_type varchar default null
)
returns bigint
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_before bigint;
  v_after bigint;
begin
  if not private.is_service_role() and not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_admin_id is not null and not private.is_service_role() and p_admin_id is distinct from (select auth.uid()) then
    raise exception 'Forbidden';
  end if;

  select points
    into v_before
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  v_after := v_before + p_amount;

  if v_after < 0 then
    raise exception 'Points cannot be negative';
  end if;

  update public.user_profiles
  set points = v_after,
      updated_at = now()
  where id = p_user_id;

  insert into public.point_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    related_type,
    related_id,
    admin_id
  ) values (
    p_user_id,
    p_type,
    p_amount,
    v_before,
    v_after,
    p_description,
    p_related_type,
    p_reference_id,
    p_admin_id
  );

  return v_after;
end;
$$;

create or replace function public.add_points(
  p_user_id uuid,
  p_amount integer,
  p_type varchar,
  p_reference_id uuid default null,
  p_description text default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_admin_id uuid := (select auth.uid());
begin
  if not private.is_service_role() and (v_admin_id is null or not private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  return private.add_points(
    p_user_id,
    p_amount::bigint,
    p_type,
    p_reference_id,
    p_description,
    case when private.is_service_role() then null else v_admin_id end,
    'rpc_add_points'
  );
end;
$$;

create or replace function private.request_withdrawal_v2(
  p_user_id uuid,
  p_amount bigint,
  p_bank text,
  p_account_number text,
  p_account_holder text
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_before bigint;
  v_after bigint;
  v_withdrawal_record record;
begin
  if not private.is_service_role() and (select auth.uid()) is distinct from p_user_id then
    raise exception 'Forbidden';
  end if;

  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  select points
    into v_before
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;

  if v_before < p_amount then
    return jsonb_build_object('success', false, 'error', '포인트가 부족합니다.');
  end if;

  v_after := v_before - p_amount;

  update public.user_profiles
  set points = v_after,
      updated_at = now(),
      bank = p_bank,
      account_number = p_account_number,
      account_holder = p_account_holder
  where id = p_user_id;

  insert into public.withdrawal_requests (
    user_id,
    amount,
    bank,
    account_number,
    account_holder,
    status
  ) values (
    p_user_id,
    p_amount,
    p_bank,
    p_account_number,
    p_account_holder,
    'pending'
  ) returning * into v_withdrawal_record;

  insert into public.point_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    related_id,
    related_type,
    description
  ) values (
    p_user_id,
    'withdraw_pending',
    -p_amount,
    v_before,
    v_after,
    v_withdrawal_record.id,
    'withdrawal_request',
    '출금 신청 (대기)'
  );

  return jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_withdrawal_record.id,
      'user_id', v_withdrawal_record.user_id,
      'amount', v_withdrawal_record.amount,
      'bank', v_withdrawal_record.bank,
      'account_number', v_withdrawal_record.account_number,
      'account_holder', v_withdrawal_record.account_holder,
      'status', v_withdrawal_record.status,
      'created_at', v_withdrawal_record.created_at
    ),
    'message', '출금 신청이 완료되었습니다.'
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.request_withdrawal_v2(
  p_user_id uuid,
  p_amount integer,
  p_bank text,
  p_account_number text,
  p_account_holder text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is distinct from p_user_id and not private.is_service_role() then
    raise exception 'Forbidden';
  end if;

  return private.request_withdrawal_v2(
    p_user_id,
    p_amount::bigint,
    p_bank,
    p_account_number,
    p_account_holder
  );
end;
$$;

create or replace function private.gift_buy(p_gift_id uuid, p_quantity integer)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_qty integer := coalesce(p_quantity, 0);
  v_gift record;
  v_cost bigint;
  v_before bigint;
  v_after bigint;
  v_tx_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_qty <= 0 then
    raise exception 'Invalid quantity';
  end if;

  select id, buy_price, is_active
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  if v_gift.is_active is false then
    raise exception 'Gift is inactive';
  end if;

  v_cost := coalesce(v_gift.buy_price, 0)::bigint * v_qty::bigint;

  select points
    into v_before
  from public.user_profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if v_before < v_cost then
    raise exception 'Insufficient balance';
  end if;

  v_after := v_before - v_cost;

  update public.user_profiles
  set points = v_after,
      gift_inventory_count = coalesce(gift_inventory_count, 0) + v_qty,
      gift_inventory_value = coalesce(gift_inventory_value, 0) + v_cost,
      updated_at = now()
  where id = v_user_id;

  insert into public.gift_transactions (
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    room_id,
    points_amount,
    quantity,
    transaction_type
  ) values (
    p_gift_id,
    v_user_id,
    'user',
    v_user_id,
    'user',
    null,
    v_cost::integer,
    v_qty,
    'buy'
  ) returning id into v_tx_id;

  insert into public.point_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    related_type,
    related_id
  ) values (
    v_user_id,
    'gift_buy',
    -v_cost,
    v_before,
    v_after,
    '기프트 구매',
    'gift_transactions',
    v_tx_id
  );

  insert into public.gift_inventory (owner_id, owner_type, gift_id, quantity, acquired_at)
  values (v_user_id, 'user', p_gift_id, v_qty, now())
  on conflict (owner_id, gift_id, owner_type)
  do update set
    quantity = coalesce(public.gift_inventory.quantity, 0) + excluded.quantity,
    acquired_at = now();

  return v_tx_id;
end;
$$;

create or replace function public.gift_buy(p_gift_id uuid, p_quantity integer)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.gift_buy(p_gift_id, p_quantity);
end;
$$;

create or replace function private.gift_sell(p_gift_id uuid, p_quantity integer)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid := auth.uid();
  v_qty integer := coalesce(p_quantity, 0);
  v_gift record;
  v_gain bigint;
  v_inventory_value_delta bigint;
  v_before bigint;
  v_after bigint;
  v_tx_id uuid;
  v_inv record;
  v_inv_after integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_qty <= 0 then
    raise exception 'Invalid quantity';
  end if;

  select id, buy_price, sell_price
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  select id, quantity
    into v_inv
  from public.gift_inventory
  where owner_id = v_user_id
    and owner_type = 'user'
    and gift_id = p_gift_id
  for update;

  if not found or coalesce(v_inv.quantity, 0) < v_qty then
    raise exception 'Insufficient inventory';
  end if;

  v_inv_after := coalesce(v_inv.quantity, 0) - v_qty;

  update public.gift_inventory
  set quantity = v_inv_after
  where id = v_inv.id;

  delete from public.gift_inventory
  where id = v_inv.id
    and quantity <= 0;

  v_gain := coalesce(v_gift.sell_price, 0)::bigint * v_qty::bigint;
  v_inventory_value_delta := coalesce(v_gift.buy_price, 0)::bigint * v_qty::bigint;

  select points
    into v_before
  from public.user_profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  v_after := v_before + v_gain;

  update public.user_profiles
  set points = v_after,
      gift_inventory_count = greatest(coalesce(gift_inventory_count, 0) - v_qty, 0),
      gift_inventory_value = greatest(coalesce(gift_inventory_value, 0) - v_inventory_value_delta, 0),
      updated_at = now()
  where id = v_user_id;

  insert into public.gift_transactions (
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    room_id,
    points_amount,
    quantity,
    transaction_type
  ) values (
    p_gift_id,
    v_user_id,
    'user',
    v_user_id,
    'user',
    null,
    v_gain::integer,
    v_qty,
    'sell'
  ) returning id into v_tx_id;

  insert into public.point_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    related_type,
    related_id
  ) values (
    v_user_id,
    'gift_sell',
    v_gain,
    v_before,
    v_after,
    '기프트 판매',
    'gift_transactions',
    v_tx_id
  );

  return v_tx_id::text;
end;
$$;

create or replace function public.gift_sell(p_gift_id uuid, p_quantity integer)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.gift_sell(p_gift_id, p_quantity);
end;
$$;

create or replace function private.admin_gift_grant(
  p_owner_id uuid,
  p_gift_id uuid,
  p_quantity integer,
  p_owner_type text default 'user',
  p_admin_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_admin_id uuid := auth.uid();
  v_gift record;
  v_points_amount bigint;
begin
  if p_admin_id is not null and p_admin_id is distinct from v_admin_id then
    raise exception 'Forbidden';
  end if;

  if v_admin_id is null or not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_owner_type not in ('user', 'agent') then
    raise exception 'Invalid owner_type';
  end if;

  if p_quantity <= 0 then
    raise exception 'Invalid quantity';
  end if;

  select id, buy_price
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  v_points_amount := coalesce(v_gift.buy_price, 0)::bigint * p_quantity::bigint;

  insert into public.gift_inventory (owner_id, owner_type, gift_id, quantity, acquired_at)
  values (p_owner_id, p_owner_type, p_gift_id, p_quantity, now())
  on conflict (owner_id, gift_id, owner_type)
  do update set
    quantity = coalesce(public.gift_inventory.quantity, 0) + excluded.quantity,
    acquired_at = now();

  insert into public.gift_transactions (
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    quantity,
    points_amount,
    transaction_type,
    admin_id
  ) values (
    p_gift_id,
    v_admin_id,
    'admin',
    p_owner_id,
    p_owner_type,
    p_quantity,
    v_points_amount::integer,
    'admin_grant',
    v_admin_id
  );

  return 'OK';
end;
$$;

create or replace function public.admin_gift_grant(
  p_owner_id uuid,
  p_gift_id uuid,
  p_quantity integer,
  p_owner_type text default 'user',
  p_admin_id uuid default null
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.admin_gift_grant(p_owner_id, p_gift_id, p_quantity, p_owner_type, p_admin_id);
end;
$$;

create or replace function private.admin_gift_revoke(
  p_owner_id uuid,
  p_gift_id uuid,
  p_quantity integer,
  p_owner_type text default 'user',
  p_admin_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_admin_id uuid := auth.uid();
  v_current_quantity integer;
begin
  if p_admin_id is not null and p_admin_id is distinct from v_admin_id then
    raise exception 'Forbidden';
  end if;

  if v_admin_id is null or not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_owner_type not in ('user', 'agent') then
    raise exception 'Invalid owner_type';
  end if;

  if p_quantity <= 0 then
    raise exception 'Invalid quantity';
  end if;

  select quantity
    into v_current_quantity
  from public.gift_inventory
  where owner_id = p_owner_id
    and gift_id = p_gift_id
    and owner_type = p_owner_type
  for update;

  if not found or v_current_quantity < p_quantity then
    raise exception 'Insufficient quantity';
  end if;

  update public.gift_inventory
  set quantity = quantity - p_quantity
  where owner_id = p_owner_id
    and gift_id = p_gift_id
    and owner_type = p_owner_type;

  delete from public.gift_inventory
  where owner_id = p_owner_id
    and gift_id = p_gift_id
    and owner_type = p_owner_type
    and quantity <= 0;

  insert into public.gift_transactions (
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    quantity,
    points_amount,
    transaction_type,
    admin_id
  ) values (
    p_gift_id,
    p_owner_id,
    p_owner_type,
    v_admin_id,
    'admin',
    p_quantity,
    0,
    'admin_revoke',
    v_admin_id
  );

  return 'OK';
end;
$$;

create or replace function public.admin_gift_revoke(
  p_owner_id uuid,
  p_gift_id uuid,
  p_quantity integer,
  p_owner_type text default 'user',
  p_admin_id uuid default null
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.admin_gift_revoke(p_owner_id, p_gift_id, p_quantity, p_owner_type, p_admin_id);
end;
$$;

create or replace function private.admin_reclaim_gift_inventory(p_gift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_admin_id uuid := auth.uid();
  v_gift record;
  v_count bigint := 0;
  v_total_refund bigint := 0;
  r record;
  v_refund bigint;
begin
  if v_admin_id is null or not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  select id, name, sell_price
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  for r in
    select id, owner_id, owner_type, quantity
    from public.gift_inventory
    where gift_id = p_gift_id
    for update
  loop
    if r.owner_type <> 'user' or r.owner_id is null or coalesce(r.quantity, 0) <= 0 then
      delete from public.gift_inventory where id = r.id;
      continue;
    end if;

    v_refund := coalesce(v_gift.sell_price, 0)::bigint * coalesce(r.quantity, 0)::bigint;

    perform private.add_points(
      r.owner_id,
      v_refund,
      'gift_reclaim',
      p_gift_id,
      '기프트 회수 환급: ' || coalesce(v_gift.name, 'gift') || ' x' || coalesce(r.quantity, 0)::text,
      v_admin_id,
      'gifts'
    );

    delete from public.gift_inventory where id = r.id;

    v_count := v_count + 1;
    v_total_refund := v_total_refund + v_refund;
  end loop;

  return jsonb_build_object('rows', v_count, 'total_refund', v_total_refund);
end;
$$;

create or replace function public.admin_reclaim_gift_inventory(p_gift_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.admin_reclaim_gift_inventory(p_gift_id);
end;
$$;

revoke execute on function public.add_points(uuid, integer, varchar, uuid, text) from public, anon;
revoke execute on function public.request_withdrawal_v2(uuid, integer, text, text, text) from public, anon;
revoke execute on function public.gift_buy(uuid, integer) from public, anon;
revoke execute on function public.gift_sell(uuid, integer) from public, anon;
revoke execute on function public.admin_gift_grant(uuid, uuid, integer, text, uuid) from public, anon;
revoke execute on function public.admin_gift_revoke(uuid, uuid, integer, text, uuid) from public, anon;
revoke execute on function public.admin_reclaim_gift_inventory(uuid) from public, anon;

grant execute on function public.add_points(uuid, integer, varchar, uuid, text) to authenticated, service_role;
grant execute on function public.request_withdrawal_v2(uuid, integer, text, text, text) to authenticated, service_role;
grant execute on function public.gift_buy(uuid, integer) to authenticated;
grant execute on function public.gift_sell(uuid, integer) to authenticated;
grant execute on function public.admin_gift_grant(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function public.admin_gift_revoke(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function public.admin_reclaim_gift_inventory(uuid) to authenticated;

grant usage on schema private to service_role;
grant execute on function private.is_service_role() to anon, authenticated, service_role;
grant execute on function private.add_points(uuid, bigint, varchar, uuid, text, uuid, varchar) to authenticated, service_role;
grant execute on function private.request_withdrawal_v2(uuid, bigint, text, text, text) to authenticated, service_role;
grant execute on function private.gift_buy(uuid, integer) to authenticated;
grant execute on function private.gift_sell(uuid, integer) to authenticated;
grant execute on function private.admin_gift_grant(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function private.admin_gift_revoke(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function private.admin_reclaim_gift_inventory(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.deposit_requests;
    alter publication supabase_realtime add table public.withdrawal_requests;
  end if;
exception
  when duplicate_object then
    null;
end $$;
