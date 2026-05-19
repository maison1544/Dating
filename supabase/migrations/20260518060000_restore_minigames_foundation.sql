create table public.game_settings (
  id uuid primary key default gen_random_uuid(),
  game_type varchar not null unique check (game_type in ('ladder', 'powerball')),
  is_active boolean default true,
  min_bet integer default 1000,
  max_bet integer default 1000000,
  round_duration_seconds integer default 180,
  betting_end_seconds integer default 30,
  odds jsonb default '{}'::jsonb,
  updated_by uuid references public.admins(id) on delete set null,
  updated_at timestamptz default now()
);

create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_type varchar not null check (game_type in ('ladder', 'powerball')),
  round_number text,
  status varchar not null default 'pending' check (status in ('pending', 'betting', 'closed', 'playing', 'completed', 'settled')),
  result jsonb,
  start_time timestamptz,
  end_time timestamptz,
  betting_end_time timestamptz,
  total_bet_amount bigint default 0,
  total_win_amount bigint default 0,
  profit bigint default 0,
  is_settled boolean default false,
  settled_at timestamptz,
  reserved_result jsonb,
  reserved_by uuid references public.admins(id) on delete set null,
  reserved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.game_bets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  bet_type varchar not null,
  bet_value varchar not null,
  bet_amount bigint not null,
  odds numeric not null,
  status varchar not null default 'pending' check (status in ('pending', 'won', 'lost', 'cancelled', 'refunded')),
  win_amount bigint default 0,
  settled_at timestamptz,
  created_at timestamptz default now(),
  ip_address text
);

create table public.game_chats (
  id uuid primary key default gen_random_uuid(),
  game_type varchar not null check (game_type in ('ladder', 'powerball')),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

create table public.ladder_game_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  created_at timestamptz default now()
);

create table public.powerball_game_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  created_at timestamptz default now()
);

create index idx_game_settings_updated_by on public.game_settings(updated_by);
create index idx_game_rounds_type_status on public.game_rounds(game_type, status);
create index idx_game_rounds_created on public.game_rounds(created_at desc);
create index idx_game_rounds_reserved_by on public.game_rounds(reserved_by);
create unique index uq_game_rounds_game_type_round_number on public.game_rounds(game_type, round_number) where round_number is not null;
create unique index uq_game_rounds_one_betting_per_game_type on public.game_rounds(game_type) where status = 'betting';
create index idx_game_bets_round on public.game_bets(round_id);
create index idx_game_bets_user on public.game_bets(user_id);
create index idx_game_chats_type on public.game_chats(game_type);
create index idx_game_chats_created on public.game_chats(created_at desc);
create index idx_game_chats_user_id on public.game_chats(user_id);

alter table public.game_settings enable row level security;
alter table public.game_rounds enable row level security;
alter table public.game_bets enable row level security;
alter table public.game_chats enable row level security;
alter table public.ladder_game_chats enable row level security;
alter table public.powerball_game_chats enable row level security;

create policy "game_settings_select" on public.game_settings
for select using (true);
create policy "game_settings_admin_manage" on public.game_settings
for all using (private.is_admin()) with check (private.is_admin());

create policy "game_rounds_select" on public.game_rounds
for select using (true);
create policy "game_rounds_admin_manage" on public.game_rounds
for all using (private.is_admin()) with check (private.is_admin());

create policy "game_bets_select" on public.game_bets
for select using (
  (select auth.uid()) = user_id
  or private.is_admin()
  or (
    private.is_agent()
    and exists (
      select 1 from public.user_profiles up
      where up.id = game_bets.user_id and up.agent_id = (select auth.uid())
    )
  )
);
create policy "game_bets_insert_self" on public.game_bets
for insert with check ((select auth.uid()) = user_id);
create policy "game_bets_admin_manage" on public.game_bets
for all using (private.is_admin()) with check (private.is_admin());

create policy "game_chats_select_authenticated" on public.game_chats
for select using ((select auth.uid()) is not null);
create policy "game_chats_insert_self" on public.game_chats
for insert with check ((select auth.uid()) = user_id);

create policy "ladder_game_chats_select_all" on public.ladder_game_chats
for select to anon, authenticated using (true);
create policy "powerball_game_chats_select_all" on public.powerball_game_chats
for select to anon, authenticated using (true);

create or replace view public.game_rounds_secure as
select
  id,
  game_type,
  round_number,
  status,
  start_time,
  betting_end_time,
  end_time,
  total_bet_amount,
  total_win_amount,
  profit,
  is_settled,
  settled_at,
  created_at,
  updated_at,
  case
    when status in ('completed', 'settled') then result
    when private.is_admin() then result
    else null::jsonb
  end as result,
  case
    when private.is_admin() then reserved_result
    else null::jsonb
  end as reserved_result
from public.game_rounds;

insert into public.game_settings (game_type, is_active, min_bet, max_bet, round_duration_seconds, betting_end_seconds, odds)
values
  ('powerball', true, 1000, 1000000, 180, 30, '{"enabled":{"normal-odd":true,"normal-even":true,"normal-under":true,"normal-over":true,"powerball-odd":true,"powerball-even":true,"powerball-under":true,"powerball-over":true},"odds":{"normal-odd":1.95,"normal-even":1.95,"normal-under":1.95,"normal-over":1.95,"powerball-odd":1.95,"powerball-even":1.95,"powerball-under":1.95,"powerball-over":1.95}}'::jsonb),
  ('ladder', true, 1000, 1000000, 180, 30, '{"enabled":{"leftStart":true,"rightStart":true,"line3":true,"line4":true,"oddEnd":true,"evenEnd":true,"left3Even":true,"left4Odd":true,"right3Odd":true,"right4Even":true},"odds":{"leftStart":1.95,"rightStart":1.95,"line3":1.95,"line4":1.95,"oddEnd":1.95,"evenEnd":1.95,"left3Even":3.8,"left4Odd":3.8,"right3Odd":3.8,"right4Even":3.8}}'::jsonb)
on conflict (game_type) do update set
  is_active = excluded.is_active,
  min_bet = excluded.min_bet,
  max_bet = excluded.max_bet,
  round_duration_seconds = excluded.round_duration_seconds,
  betting_end_seconds = excluded.betting_end_seconds,
  odds = excluded.odds,
  updated_at = now();

create or replace function public.get_server_time()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select now();
$$;

create or replace function public.game_generate_result_ladder()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start text;
  v_lines int;
  v_oe text;
begin
  v_start := case when random() < 0.5 then 'left' else 'right' end;
  v_lines := case when random() < 0.5 then 3 else 4 end;
  v_oe := case
    when v_start = 'left' and v_lines = 3 then 'even'
    when v_start = 'left' and v_lines = 4 then 'odd'
    when v_start = 'right' and v_lines = 3 then 'odd'
    else 'even'
  end;

  return jsonb_build_object(
    'startPosition', v_start,
    'lineCount', v_lines,
    'oddEven', v_oe,
    'result', v_start
  );
end;
$$;

create or replace function public.game_generate_result_powerball()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normal_balls int[] := '{}'::int[];
  v_ball int;
  v_powerball int;
  v_normal_sum int;
begin
  while coalesce(array_length(v_normal_balls, 1), 0) < 5 loop
    v_ball := floor(random() * 28 + 1)::int;
    if not (v_ball = any(v_normal_balls)) then
      v_normal_balls := array_append(v_normal_balls, v_ball);
    end if;
  end loop;

  select array_agg(x order by x) into v_normal_balls from unnest(v_normal_balls) x;
  select coalesce(sum(x), 0) into v_normal_sum from unnest(v_normal_balls) x;
  v_powerball := floor(random() * 10)::int;

  return jsonb_build_object(
    'normalBalls', to_jsonb(v_normal_balls),
    'powerball', v_powerball,
    'normalSum', v_normal_sum,
    'normalOddEven', case when mod(v_normal_sum, 2) = 1 then 'odd' else 'even' end,
    'normalUnderOver', case when v_normal_sum <= 72 then 'under' else 'over' end,
    'powerballOddEven', case when mod(v_powerball, 2) = 1 then 'odd' else 'even' end,
    'powerballUnderOver', case when v_powerball <= 4 then 'under' else 'over' end
  );
end;
$$;

create or replace function public.game_resolve_auto_ladder(p_reserved jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_start text;
  v_lines int;
  v_oe text;
  v_valid_oe text;
begin
  v_start := case
    when p_reserved->>'startPosition' = 'auto' or p_reserved->>'startPosition' is null then case when random() < 0.5 then 'left' else 'right' end
    else p_reserved->>'startPosition'
  end;

  v_lines := case
    when p_reserved->>'lineCount' = 'auto' or p_reserved->'lineCount' is null then case when random() < 0.5 then 3 else 4 end
    else (p_reserved->>'lineCount')::int
  end;

  v_oe := p_reserved->>'oddEven';

  v_valid_oe := case
    when v_start = 'left' and v_lines = 3 then 'even'
    when v_start = 'left' and v_lines = 4 then 'odd'
    when v_start = 'right' and v_lines = 3 then 'odd'
    when v_start = 'right' and v_lines = 4 then 'even'
    else case when random() < 0.5 then 'odd' else 'even' end
  end;

  if v_oe = 'auto' or v_oe is null then
    v_oe := v_valid_oe;
  elsif v_oe != v_valid_oe then
    if v_start = 'left' then
      v_lines := case when v_oe = 'even' then 3 else 4 end;
    else
      v_lines := case when v_oe = 'odd' then 3 else 4 end;
    end if;
  end if;

  return jsonb_build_object(
    'startPosition', v_start,
    'lineCount', v_lines,
    'oddEven', v_oe,
    'result', v_start
  );
end;
$$;

create or replace function public.game_resolve_auto_powerball(p_reserved jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_normal_oe text;
  v_normal_uo text;
  v_power_oe text;
  v_power_uo text;
  v_normal_balls int[] := '{}'::int[];
  v_ball int;
  v_powerball int;
  v_normal_sum int;
  v_attempt int := 0;
begin
  v_normal_oe := case when p_reserved->>'normalOddEven' = 'auto' or p_reserved->>'normalOddEven' is null then case when random() < 0.5 then 'odd' else 'even' end else p_reserved->>'normalOddEven' end;
  v_normal_uo := case when p_reserved->>'normalUnderOver' = 'auto' or p_reserved->>'normalUnderOver' is null then case when random() < 0.5 then 'under' else 'over' end else p_reserved->>'normalUnderOver' end;
  v_power_oe := case when p_reserved->>'powerballOddEven' = 'auto' or p_reserved->>'powerballOddEven' is null then case when random() < 0.5 then 'odd' else 'even' end else p_reserved->>'powerballOddEven' end;
  v_power_uo := case when p_reserved->>'powerballUnderOver' = 'auto' or p_reserved->>'powerballUnderOver' is null then case when random() < 0.5 then 'under' else 'over' end else p_reserved->>'powerballUnderOver' end;

  while v_attempt < 1000 loop
    v_normal_balls := '{}'::int[];
    while coalesce(array_length(v_normal_balls, 1), 0) < 5 loop
      v_ball := floor(random() * 28 + 1)::int;
      if not (v_ball = any(v_normal_balls)) then
        v_normal_balls := array_append(v_normal_balls, v_ball);
      end if;
    end loop;

    select coalesce(sum(x), 0) into v_normal_sum from unnest(v_normal_balls) x;

    if (case when mod(v_normal_sum, 2) = 1 then 'odd' else 'even' end) = v_normal_oe
       and (case when v_normal_sum <= 72 then 'under' else 'over' end) = v_normal_uo then
      exit;
    end if;

    v_attempt := v_attempt + 1;
  end loop;

  select array_agg(x order by x) into v_normal_balls from unnest(v_normal_balls) x;

  v_attempt := 0;
  while v_attempt < 100 loop
    v_powerball := floor(random() * 10)::int;
    if (case when mod(v_powerball, 2) = 1 then 'odd' else 'even' end) = v_power_oe
       and (case when v_powerball <= 4 then 'under' else 'over' end) = v_power_uo then
      exit;
    end if;
    v_attempt := v_attempt + 1;
  end loop;

  return jsonb_build_object(
    'normalBalls', to_jsonb(v_normal_balls),
    'powerball', v_powerball,
    'normalSum', v_normal_sum,
    'normalOddEven', v_normal_oe,
    'normalUnderOver', v_normal_uo,
    'powerballOddEven', v_power_oe,
    'powerballUnderOver', v_power_uo
  );
end;
$$;

create or replace function public.game_check_bet_won(p_game_type text, p_bet_type text, p_result jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_start text;
  v_line int;
  v_oe text;
begin
  if p_game_type = 'powerball' then
    case p_bet_type
      when 'normal-odd' then return (p_result->>'normalOddEven') = 'odd';
      when 'normal-even' then return (p_result->>'normalOddEven') = 'even';
      when 'normal-under' then return (p_result->>'normalUnderOver') = 'under';
      when 'normal-over' then return (p_result->>'normalUnderOver') = 'over';
      when 'powerball-odd' then return (p_result->>'powerballOddEven') = 'odd';
      when 'powerball-even' then return (p_result->>'powerballOddEven') = 'even';
      when 'powerball-under' then return (p_result->>'powerballUnderOver') = 'under';
      when 'powerball-over' then return (p_result->>'powerballUnderOver') = 'over';
      else return false;
    end case;
  end if;

  v_start := p_result->>'startPosition';
  begin
    v_line := nullif(p_result->>'lineCount', '')::int;
  exception when others then
    v_line := null;
  end;
  v_oe := p_result->>'oddEven';

  case p_bet_type
    when 'leftStart' then return v_start = 'left';
    when 'rightStart' then return v_start = 'right';
    when 'line3' then return v_line = 3;
    when 'line4' then return v_line = 4;
    when 'oddEnd' then return v_oe = 'odd';
    when 'evenEnd' then return v_oe = 'even';
    when 'left3Even' then return v_start = 'left' and v_line = 3 and v_oe = 'even';
    when 'left4Odd' then return v_start = 'left' and v_line = 4 and v_oe = 'odd';
    when 'right3Odd' then return v_start = 'right' and v_line = 3 and v_oe = 'odd';
    when 'right4Even' then return v_start = 'right' and v_line = 4 and v_oe = 'even';
    else return false;
  end case;
end;
$$;

create or replace function public.place_bet(
  p_user_id uuid,
  p_round_id uuid,
  p_bet_type text,
  p_amount numeric,
  p_odds numeric,
  p_ip_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet_id uuid;
  v_round_record record;
  v_game_type text;
  v_settings_record record;
  v_enabled_value boolean;
  v_user_points bigint;
  v_min_bet numeric;
  v_max_bet numeric;
  v_balance_before bigint;
  v_balance_after bigint;
  v_display_round text;
begin
  if auth.uid() is null then
    raise exception '인증이 필요합니다.';
  end if;

  if auth.uid() <> p_user_id then
    raise exception '사용자 인증 정보가 일치하지 않습니다.';
  end if;

  select * into v_round_record from public.game_rounds where id = p_round_id;
  if v_round_record is null then
    raise exception '라운드를 찾을 수 없습니다.';
  end if;

  if v_round_record.status != 'betting' then
    raise exception '현재 베팅이 불가능한 라운드입니다.';
  end if;

  if v_round_record.betting_end_time is not null and v_round_record.betting_end_time < now() then
    raise exception '베팅 시간이 종료되었습니다.';
  end if;

  v_game_type := v_round_record.game_type;

  select * into v_settings_record from public.game_settings where game_type = v_game_type;
  if v_settings_record is null then
    raise exception '게임 설정을 찾을 수 없습니다.';
  end if;

  if v_settings_record.is_active = false then
    raise exception '현재 발매가 중지되었습니다.';
  end if;

  if (v_settings_record.odds->'enabled') ? p_bet_type is not true then
    raise exception '유효하지 않은 베팅 옵션입니다.';
  end if;

  v_enabled_value := (v_settings_record.odds->'enabled'->>p_bet_type)::boolean;
  if v_enabled_value = false then
    raise exception '현재 선택한 베팅 옵션이 발매 중지되었습니다. (서버 검증)';
  end if;

  v_min_bet := v_settings_record.min_bet;
  v_max_bet := v_settings_record.max_bet;

  if v_min_bet is not null and p_amount < v_min_bet then
    raise exception '최소 배팅 금액은 %P 입니다.', v_min_bet;
  end if;

  if v_max_bet is not null and p_amount > v_max_bet then
    raise exception '최대 배팅 금액은 %P 입니다.', v_max_bet;
  end if;

  select points into v_user_points from public.user_profiles where id = p_user_id for update;
  if v_user_points is null then
    raise exception '사용자 정보를 찾을 수 없습니다.';
  end if;

  if v_user_points < p_amount then
    raise exception '포인트가 부족합니다.';
  end if;

  v_balance_before := v_user_points;
  v_balance_after := v_user_points - p_amount::bigint;

  update public.user_profiles set points = v_balance_after, updated_at = now() where id = p_user_id;

  insert into public.game_bets (user_id, round_id, bet_type, bet_value, bet_amount, odds, status, ip_address)
  values (p_user_id, p_round_id, p_bet_type, p_bet_type, p_amount::bigint, p_odds, 'pending', p_ip_address)
  returning id into v_bet_id;

  update public.game_rounds
  set total_bet_amount = coalesce(total_bet_amount, 0) + p_amount::bigint,
      updated_at = now()
  where id = p_round_id;

  v_display_round := coalesce(split_part(v_round_record.round_number, '_', 2), v_round_record.round_number);

  insert into public.point_transactions (user_id, type, amount, balance_before, balance_after, related_id, related_type, description)
  values (
    p_user_id,
    'bet',
    -p_amount::bigint,
    v_balance_before,
    v_balance_after,
    v_bet_id,
    'game_bets',
    case when v_game_type = 'ladder' then '사다리' when v_game_type = 'powerball' then '파워볼' else v_game_type end || ' ' || v_display_round || '회차 배팅'
  );

  return v_bet_id;
end;
$$;

create or replace function public.game_chat_send(p_game_type text, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_game_type is null or p_game_type not in ('powerball', 'ladder') then
    raise exception 'Invalid game type';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.game_chats (game_type, user_id, message)
  values (p_game_type, v_user_id, p_message)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.game_chat_list(p_game_type text, p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(coalesce(p_limit, 50), 1);
  v_res jsonb;
begin
  if p_game_type is null or p_game_type not in ('powerball', 'ladder') then
    raise exception 'Invalid game type';
  end if;

  select jsonb_agg(to_jsonb(t) order by t.created_at asc) into v_res
  from (
    select gc.id, gc.created_at, gc.message, gc.game_type, gc.user_id, coalesce(up.nickname, up.name, '익명') as nickname
    from public.game_chats gc
    left join public.user_profiles up on up.id = gc.user_id
    where gc.game_type = p_game_type
    order by gc.created_at desc
    limit v_limit
  ) t;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  if p_id is null then
    raise exception 'Missing id';
  end if;

  select to_jsonb(t) into v_res
  from (
    select gc.id, gc.created_at, gc.message, gc.game_type, gc.user_id, coalesce(up.nickname, up.name, '익명') as nickname
    from public.game_chats gc
    left join public.user_profiles up on up.id = gc.user_id
    where gc.id = p_id
  ) t;

  if v_res is null then
    raise exception 'Not found';
  end if;

  return v_res;
end;
$$;

create or replace function public.ladder_game_chat_send(p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.ladder_game_chats(user_id, message) values (v_user_id, p_message) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.powerball_game_chat_send(p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.powerball_game_chats(user_id, message) values (v_user_id, p_message) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.ladder_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(coalesce(p_limit, 50), 1);
  v_res jsonb;
begin
  select jsonb_agg(to_jsonb(t) order by t.created_at asc) into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.ladder_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    order by c.created_at desc
    limit v_limit
  ) t;
  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.powerball_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(coalesce(p_limit, 50), 1);
  v_res jsonb;
begin
  select jsonb_agg(to_jsonb(t) order by t.created_at asc) into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.powerball_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    order by c.created_at desc
    limit v_limit
  ) t;
  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.ladder_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  select to_jsonb(t) into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.ladder_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    where c.id = p_id
  ) t;
  if v_res is null then raise exception 'Not found'; end if;
  return v_res;
end;
$$;

create or replace function public.powerball_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  select to_jsonb(t) into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.powerball_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    where c.id = p_id
  ) t;
  if v_res is null then raise exception 'Not found'; end if;
  return v_res;
end;
$$;

create or replace function public.ladder_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  with t as (
    select c.id, c.created_at, c.user_id, coalesce(u.nickname, u.name, '알 수 없음') as nickname, c.message
    from public.game_chats c
    left join public.user_profiles u on c.user_id = u.id
    where c.user_id = p_user_id
      and c.game_type = 'ladder'
      and (p_from is null or c.created_at >= p_from)
      and (p_to is null or c.created_at <= p_to)
    order by c.created_at desc
    limit coalesce(p_limit, 200)
  )
  select coalesce(json_agg(row_to_json(t) order by t.created_at asc), '[]'::json) into v from t;
  return v;
end;
$$;

create or replace function public.powerball_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  with t as (
    select c.id, c.created_at, c.user_id, coalesce(u.nickname, u.name, '알 수 없음') as nickname, c.message
    from public.game_chats c
    left join public.user_profiles u on c.user_id = u.id
    where c.user_id = p_user_id
      and c.game_type = 'powerball'
      and (p_from is null or c.created_at >= p_from)
      and (p_to is null or c.created_at <= p_to)
    order by c.created_at desc
    limit coalesce(p_limit, 200)
  )
  select coalesce(json_agg(row_to_json(t) order by t.created_at asc), '[]'::json) into v from t;
  return v;
end;
$$;

create or replace function public.game_tick(p_game_type text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked boolean;
  v_game_types text[];
  v_gt text;
  v_settled jsonb := '[]'::jsonb;
  v_created jsonb := '[]'::jsonb;
  v_now timestamptz := now();
  v_round record;
  v_result jsonb;
  v_total_win bigint;
  v_profit bigint;
  v_bet record;
  v_won boolean;
  v_win_amount bigint;
  v_before bigint;
  v_after bigint;
  v_today_kst text;
  v_last_round_seq integer;
  v_new_round_number text;
  v_duration_seconds integer;
  v_is_active boolean;
  v_active_round_id uuid;
  v_display_round text;
  v_game_name text;
  v_has_auto boolean;
begin
  v_locked := pg_try_advisory_lock(87321455);
  if not v_locked then
    return jsonb_build_object('success', true, 'skipped', true);
  end if;

  if p_game_type is null then
    v_game_types := array['powerball','ladder'];
  else
    v_game_types := array[lower(p_game_type)];
  end if;

  v_today_kst := to_char(v_now at time zone 'Asia/Seoul', 'YYYYMMDD');

  foreach v_gt in array v_game_types loop
    v_game_name := case when v_gt = 'ladder' then '사다리' when v_gt = 'powerball' then '파워볼' else v_gt end;

    for v_round in
      select * from public.game_rounds
      where game_type = v_gt
        and ((status = 'betting' and betting_end_time is not null and betting_end_time < v_now) or (status = 'playing' and is_settled = false))
      order by created_at asc
    loop
      if v_round.status = 'betting' then
        update public.game_rounds set status = 'playing', updated_at = v_now where id = v_round.id and status = 'betting';
        if not found then continue; end if;
      end if;

      if exists(select 1 from public.game_rounds gr where gr.id = v_round.id and gr.is_settled = true) then
        continue;
      end if;

      if v_round.reserved_result is not null then
        if v_gt = 'powerball' then
          v_has_auto := (
            v_round.reserved_result->>'normalOddEven' = 'auto' or
            v_round.reserved_result->>'normalUnderOver' = 'auto' or
            v_round.reserved_result->>'powerballOddEven' = 'auto' or
            v_round.reserved_result->>'powerballUnderOver' = 'auto'
          );
          if v_has_auto then
            v_result := public.game_resolve_auto_powerball(v_round.reserved_result);
          else
            v_result := v_round.reserved_result;
          end if;
        else
          v_has_auto := (
            v_round.reserved_result->>'startPosition' = 'auto' or
            v_round.reserved_result->>'lineCount' = 'auto' or
            v_round.reserved_result->>'oddEven' = 'auto'
          );
          if v_has_auto then
            v_result := public.game_resolve_auto_ladder(v_round.reserved_result);
          else
            v_result := v_round.reserved_result;
          end if;
        end if;
      else
        v_result := case when v_gt = 'powerball' then public.game_generate_result_powerball() else public.game_generate_result_ladder() end;
      end if;

      v_total_win := 0;
      v_display_round := coalesce(split_part(v_round.round_number, '_', 2), v_round.round_number);

      for v_bet in select * from public.game_bets where round_id = v_round.id and status = 'pending' loop
        v_won := public.game_check_bet_won(v_gt, v_bet.bet_type, v_result);
        v_win_amount := case when v_won then floor((v_bet.bet_amount::numeric) * (v_bet.odds::numeric))::bigint else 0 end;
        v_total_win := v_total_win + v_win_amount;

        update public.game_bets
        set status = case when v_won then 'won' else 'lost' end,
            win_amount = v_win_amount,
            settled_at = v_now
        where id = v_bet.id;

        select points into v_before from public.user_profiles where id = v_bet.user_id for update;
        if not found then continue; end if;

        if v_won and v_win_amount > 0 then
          v_after := v_before + v_win_amount;
          update public.user_profiles set points = v_after, updated_at = v_now where id = v_bet.user_id;
          insert into public.point_transactions(user_id, type, amount, balance_before, balance_after, related_id, related_type, description, admin_id)
          values (v_bet.user_id, 'win', v_win_amount, v_before, v_after, v_bet.id, 'game_bets', v_game_name || ' ' || v_display_round || '회차 당첨', null);
        else
          insert into public.point_transactions(user_id, type, amount, balance_before, balance_after, related_id, related_type, description, admin_id)
          values (v_bet.user_id, 'lose', -v_bet.bet_amount, v_before, v_before, v_bet.id, 'game_bets', v_game_name || ' ' || v_display_round || '회차 미당첨', null);
        end if;
      end loop;

      v_profit := coalesce(v_round.total_bet_amount, 0) - v_total_win;

      update public.game_rounds
      set status = 'completed', result = v_result, end_time = v_now, total_win_amount = v_total_win, profit = v_profit, is_settled = true, settled_at = v_now, updated_at = v_now
      where id = v_round.id;

      v_settled := v_settled || jsonb_build_array(jsonb_build_object('round_id', v_round.id, 'game_type', v_gt, 'round_number', v_round.round_number));
    end loop;

    select gs.is_active, coalesce(gs.betting_end_seconds, gs.round_duration_seconds, 300)
    into v_is_active, v_duration_seconds
    from public.game_settings gs
    where gs.game_type = v_gt
    limit 1;

    if v_is_active is distinct from false then
      select gr.id into v_active_round_id
      from public.game_rounds gr
      where gr.game_type = v_gt and gr.status = 'betting' and gr.betting_end_time is not null and gr.betting_end_time >= v_now
      order by gr.created_at desc
      limit 1;

      if v_active_round_id is null then
        select coalesce(max(case when round_number like v_today_kst || '_%' then nullif(split_part(round_number, '_', 2), '')::integer else 0 end), 0)
        into v_last_round_seq
        from public.game_rounds gr
        where gr.game_type = v_gt;

        v_new_round_number := v_today_kst || '_' || (v_last_round_seq + 1)::text;

        insert into public.game_rounds(game_type, round_number, status, start_time, betting_end_time, total_bet_amount, total_win_amount, profit, is_settled, created_at, updated_at)
        values (v_gt, v_new_round_number, 'betting', v_now, v_now + make_interval(secs => v_duration_seconds), 0, 0, 0, false, v_now, v_now);

        v_created := v_created || jsonb_build_array(jsonb_build_object('game_type', v_gt, 'round_number', v_new_round_number));
      end if;
    end if;
  end loop;

  perform pg_advisory_unlock(87321455);
  return jsonb_build_object('success', true, 'settled', v_settled, 'created', v_created);
exception when others then
  perform pg_advisory_unlock(87321455);
  raise;
end;
$$;

create or replace function public.game_tick_client(p_game_type text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.game_tick(p_game_type);
end;
$$;

create or replace function public.admin_game_tick(p_game_type text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  return public.game_tick(p_game_type);
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_rounds') then
      alter publication supabase_realtime add table public.game_rounds;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_bets') then
      alter publication supabase_realtime add table public.game_bets;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_chats') then
      alter publication supabase_realtime add table public.game_chats;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ladder_game_chats') then
      alter publication supabase_realtime add table public.ladder_game_chats;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'powerball_game_chats') then
      alter publication supabase_realtime add table public.powerball_game_chats;
    end if;
  end if;
end $$;

grant select on public.game_settings, public.game_rounds, public.game_rounds_secure, public.game_chats, public.ladder_game_chats, public.powerball_game_chats to anon, authenticated;
grant select, insert on public.game_bets to authenticated;
grant insert on public.game_chats to authenticated;
grant all on public.game_settings, public.game_rounds, public.game_bets, public.game_chats, public.ladder_game_chats, public.powerball_game_chats to service_role;

grant execute on function public.get_server_time() to anon, authenticated;
grant execute on function public.game_tick_client(text) to anon, authenticated;
grant execute on function public.admin_game_tick(text) to authenticated;
grant execute on function public.place_bet(uuid, uuid, text, numeric, numeric, text) to authenticated;
grant execute on function public.game_chat_send(text, text) to authenticated;
grant execute on function public.game_chat_list(text, integer) to anon, authenticated;
grant execute on function public.game_chat_get(uuid) to anon, authenticated;
grant execute on function public.ladder_game_chat_send(text) to authenticated;
grant execute on function public.ladder_game_chat_list(integer) to anon, authenticated;
grant execute on function public.ladder_game_chat_get(uuid) to anon, authenticated;
grant execute on function public.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
grant execute on function public.powerball_game_chat_send(text) to authenticated;
grant execute on function public.powerball_game_chat_list(integer) to anon, authenticated;
grant execute on function public.powerball_game_chat_get(uuid) to anon, authenticated;
grant execute on function public.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;

select public.game_tick_client(null);
