create or replace function private.check_phone_duplicate(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_exists boolean;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  if v_phone = '' then
    return false;
  end if;

  select exists(
    select 1
    from public.user_profiles
    where deleted_at is null
      and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone
  ) into v_exists;

  return v_exists;
end;
$$;

create or replace function public.check_phone_duplicate(p_phone text)
returns boolean
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.check_phone_duplicate(p_phone);
end;
$$;

create or replace function private.heartbeat_session()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_timeout_minutes integer;
begin
  if v_uid is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  update public.admins
  set last_active_at = now(), updated_at = now()
  where id = v_uid and coalesce(is_active, true) = true
  returning 'admin' into v_role;

  if v_role is null then
    update public.agents
    set last_active_at = now(), updated_at = now()
    where id = v_uid and coalesce(is_active, true) = true
    returning 'agent' into v_role;
  end if;

  if v_role is null then
    update public.user_profiles
    set last_active_at = now(), last_activity = now(), is_online = true, updated_at = now()
    where id = v_uid and status = 'active'
    returning 'user' into v_role;
  end if;

  if v_role is null then
    return json_build_object('valid', false, 'reason', 'account_not_found');
  end if;

  select coalesce(nullif(value, '')::integer, 30)
  into v_timeout_minutes
  from public.system_settings
  where key = 'session_timeout_' || v_role;

  return json_build_object('valid', true, 'role', v_role, 'timeout_minutes', coalesce(v_timeout_minutes, 30));
end;
$$;

create or replace function public.heartbeat_session()
returns json
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  return private.heartbeat_session();
end;
$$;

create or replace function private.check_session_valid()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_last_active timestamptz;
  v_timeout_minutes integer;
  v_elapsed_minutes double precision;
begin
  if v_uid is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  select 'admin', last_active_at
  into v_role, v_last_active
  from public.admins
  where id = v_uid and coalesce(is_active, true) = true;

  if v_role is null then
    select 'agent', last_active_at
    into v_role, v_last_active
    from public.agents
    where id = v_uid and coalesce(is_active, true) = true;
  end if;

  if v_role is null then
    select 'user', last_active_at
    into v_role, v_last_active
    from public.user_profiles
    where id = v_uid and status = 'active';
  end if;

  if v_role is null then
    return json_build_object('valid', false, 'reason', 'account_not_found');
  end if;

  if v_last_active is null then
    return json_build_object('valid', true, 'role', v_role);
  end if;

  select coalesce(nullif(value, '')::integer, 30)
  into v_timeout_minutes
  from public.system_settings
  where key = 'session_timeout_' || v_role;

  v_timeout_minutes := coalesce(v_timeout_minutes, 30);
  v_elapsed_minutes := extract(epoch from (now() - v_last_active)) / 60.0;

  if v_elapsed_minutes > v_timeout_minutes then
    return json_build_object(
      'valid', false,
      'reason', 'session_expired',
      'elapsed_minutes', round(v_elapsed_minutes::numeric, 1),
      'timeout_minutes', v_timeout_minutes
    );
  end if;

  return json_build_object('valid', true, 'role', v_role);
end;
$$;

create or replace function public.check_session_valid()
returns json
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  return private.check_session_valid();
end;
$$;

create or replace function private.increment_notice_view(p_notice_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views integer;
begin
  update public.notices
  set view_count = coalesce(view_count, 0) + 1,
      updated_at = now()
  where id = p_notice_id
    and coalesce(is_published, true) = true
  returning view_count into v_new_views;

  return coalesce(v_new_views, 0);
end;
$$;

create or replace function public.increment_notice_view(p_notice_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.increment_notice_view(p_notice_id);
end;
$$;

create or replace function private.game_tick_client(p_game_type text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.game_tick(p_game_type);
end;
$$;

create or replace function public.game_tick_client(p_game_type text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.game_tick_client(p_game_type);
end;
$$;

create or replace function public.game_tick_client()
returns json
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.game_tick_client(null::text)::json;
end;
$$;

create or replace function private.admin_game_tick(p_game_type text default null)
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

create or replace function public.admin_game_tick(p_game_type text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  return private.admin_game_tick(p_game_type);
end;
$$;

create or replace function private.admin_force_process_round(p_round_id uuid, p_result jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gt text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  select lower(game_type)
  into v_gt
  from public.game_rounds
  where id = p_round_id;

  if v_gt is null then
    raise exception 'Round not found';
  end if;

  if p_result is not null then
    update public.game_rounds
    set reserved_result = p_result,
        reserved_by = auth.uid(),
        reserved_at = now(),
        updated_at = now()
    where id = p_round_id;
  end if;

  update public.game_rounds
  set betting_end_time = now() - interval '2 seconds',
      updated_at = now()
  where id = p_round_id;

  return public.game_tick(v_gt);
end;
$$;

create or replace function public.admin_force_process_round(p_round_id uuid, p_result jsonb default null)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  return private.admin_force_process_round(p_round_id, p_result);
end;
$$;

create or replace function private.place_bet(
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

  select * into v_round_record
  from public.game_rounds
  where id = p_round_id;

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

  select * into v_settings_record
  from public.game_settings
  where game_type = v_game_type;

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

  select points into v_user_points
  from public.user_profiles
  where id = p_user_id
  for update;

  if v_user_points is null then
    raise exception '사용자 정보를 찾을 수 없습니다.';
  end if;

  if v_user_points < p_amount then
    raise exception '포인트가 부족합니다.';
  end if;

  v_balance_before := v_user_points;
  v_balance_after := v_user_points - p_amount::bigint;

  update public.user_profiles
  set points = v_balance_after,
      updated_at = now()
  where id = p_user_id;

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
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception '인증이 필요합니다.';
  end if;

  if auth.uid() <> p_user_id then
    raise exception '사용자 인증 정보가 일치하지 않습니다.';
  end if;

  return private.place_bet(p_user_id, p_round_id, p_bet_type, p_amount, p_odds, p_ip_address);
end;
$$;

create or replace function public.place_bet(
  p_user_id uuid,
  p_round_id uuid,
  p_bet_type text,
  p_amount integer,
  p_odds numeric
)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return public.place_bet(p_user_id, p_round_id, p_bet_type, p_amount::numeric, p_odds, null::text);
end;
$$;

grant execute on function private.check_phone_duplicate(text) to anon, authenticated;
grant execute on function private.heartbeat_session() to authenticated;
grant execute on function private.check_session_valid() to authenticated;
grant execute on function private.increment_notice_view(uuid) to anon, authenticated;
grant execute on function private.game_tick_client(text) to anon, authenticated;
grant execute on function private.admin_game_tick(text) to authenticated;
grant execute on function private.admin_force_process_round(uuid, jsonb) to authenticated;
grant execute on function private.place_bet(uuid, uuid, text, numeric, numeric, text) to authenticated;

revoke execute on function public.admin_force_process_round(uuid, jsonb) from public, anon;
revoke execute on function public.admin_game_tick(text) from public, anon;
revoke execute on function public.check_session_valid() from public, anon;
revoke execute on function public.heartbeat_session() from public, anon;
revoke execute on function public.place_bet(uuid, uuid, text, integer, numeric) from public, anon;
revoke execute on function public.place_bet(uuid, uuid, text, numeric, numeric, text) from public, anon;

grant execute on function public.check_phone_duplicate(text) to anon, authenticated;
grant execute on function public.increment_notice_view(uuid) to anon, authenticated;
grant execute on function public.heartbeat_session() to authenticated;
grant execute on function public.check_session_valid() to authenticated;
grant execute on function public.game_tick_client(text) to anon, authenticated;
grant execute on function public.game_tick_client() to anon, authenticated;
grant execute on function public.admin_game_tick(text) to authenticated;
grant execute on function public.admin_force_process_round(uuid, jsonb) to authenticated;
grant execute on function public.place_bet(uuid, uuid, text, integer, numeric) to authenticated;
grant execute on function public.place_bet(uuid, uuid, text, numeric, numeric, text) to authenticated;
