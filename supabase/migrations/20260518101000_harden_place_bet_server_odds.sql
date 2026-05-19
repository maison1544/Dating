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
  v_server_odds numeric;
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

  if jsonb_typeof(v_settings_record.odds->'enabled') <> 'object'
    or not ((v_settings_record.odds->'enabled') ? p_bet_type) then
    raise exception '유효하지 않은 베팅 옵션입니다.';
  end if;

  v_enabled_value := coalesce((v_settings_record.odds->'enabled'->>p_bet_type)::boolean, false);

  if v_enabled_value = false then
    raise exception '현재 선택한 베팅 옵션이 발매 중지되었습니다. (서버 검증)';
  end if;

  if jsonb_typeof(v_settings_record.odds->'odds') = 'object'
    and ((v_settings_record.odds->'odds') ? p_bet_type) then
    v_server_odds := nullif((v_settings_record.odds->'odds')->>p_bet_type, '')::numeric;
  elsif v_settings_record.odds ? p_bet_type then
    if jsonb_typeof(v_settings_record.odds->p_bet_type) = 'number' then
      v_server_odds := nullif(v_settings_record.odds->>p_bet_type, '')::numeric;
    elsif jsonb_typeof(v_settings_record.odds->p_bet_type) = 'object'
      and ((v_settings_record.odds->p_bet_type) ? 'odds') then
      v_server_odds := nullif((v_settings_record.odds->p_bet_type)->>'odds', '')::numeric;
    end if;
  end if;

  if v_server_odds is null or v_server_odds <= 0 then
    raise exception '게임 배당률 설정이 올바르지 않습니다.';
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
  values (p_user_id, p_round_id, p_bet_type, p_bet_type, p_amount::bigint, v_server_odds, 'pending', p_ip_address)
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

revoke execute on function private.place_bet(uuid, uuid, text, numeric, numeric, text) from public, anon, authenticated;
