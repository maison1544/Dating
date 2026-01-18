-- Fix place_bet RPC to populate bet_value and validate enabled bet types

alter table public.game_bets
  add column if not exists bet_value text;

update public.game_bets
set bet_value = bet_type
where bet_value is null;

alter table public.game_bets
  alter column bet_value set not null;

create or replace function public.place_bet(
  p_user_id uuid,
  p_round_id uuid,
  p_bet_type text,
  p_amount integer,
  p_odds numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round record;
  v_settings record;
  v_balance integer;
  v_bet_id uuid;
  v_enabled boolean := true;
  v_bet_value text;
  v_auth_id uuid;
  v_odds jsonb;
begin
  v_auth_id := auth.uid();
  if v_auth_id is null or v_auth_id <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid bet amount';
  end if;

  select id, game_type, status, betting_end_time
    into v_round
  from public.game_rounds
  where id = p_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  if v_round.status <> 'betting' then
    raise exception 'Betting is closed for this round';
  end if;

  if v_round.betting_end_time is not null and v_round.betting_end_time < now() then
    raise exception 'Betting is closed for this round';
  end if;

  select is_active, min_bet, max_bet, odds
    into v_settings
  from public.game_settings
  where game_type = v_round.game_type
  limit 1;

  if not found then
    v_settings := row(true, null, null, null);
  end if;

  if v_settings.is_active is false then
    raise exception 'Betting is closed for this round';
  end if;

  if v_settings.min_bet is not null and p_amount < v_settings.min_bet then
    raise exception 'Bet amount below minimum';
  end if;

  if v_settings.max_bet is not null and p_amount > v_settings.max_bet then
    raise exception 'Bet amount above maximum';
  end if;

  if v_settings.odds is not null then
    v_odds := v_settings.odds::jsonb;
    if jsonb_typeof(v_odds) = 'object' then
      if v_odds ? 'enabled' then
        v_enabled := coalesce((v_odds -> 'enabled' ->> p_bet_type)::boolean, true);
      elsif v_odds ? p_bet_type then
        v_enabled := coalesce((v_odds -> p_bet_type ->> 'enabled')::boolean, true);
      end if;
    end if;
  end if;

  if v_enabled is false then
    raise exception 'Betting option is disabled';
  end if;

  select points
    into v_balance
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  v_bet_value := case
    when v_round.game_type = 'powerball' then
      case p_bet_type
        when 'normal-odd' then '일반볼-홀'
        when 'normal-even' then '일반볼-짝'
        when 'normal-under' then '일반볼-언더'
        when 'normal-over' then '일반볼-오버'
        when 'powerball-odd' then '파워볼-홀'
        when 'powerball-even' then '파워볼-짝'
        when 'powerball-under' then '파워볼-언더'
        when 'powerball-over' then '파워볼-오버'
        else p_bet_type
      end
    when v_round.game_type = 'ladder' then
      case p_bet_type
        when 'leftStart' then '좌출발'
        when 'rightStart' then '우출발'
        when 'line3' then '3줄'
        when 'line4' then '4줄'
        when 'oddEnd' then '홀'
        when 'evenEnd' then '짝'
        when 'left3Even' then '좌3짝'
        when 'left4Odd' then '좌4홀'
        when 'right3Odd' then '우3홀'
        when 'right4Even' then '우4짝'
        else p_bet_type
      end
    else p_bet_type
  end;

  update public.user_profiles
  set points = points - p_amount
  where id = p_user_id;

  insert into public.game_bets (
    user_id,
    round_id,
    bet_type,
    bet_value,
    bet_amount,
    odds,
    status,
    win_amount
  ) values (
    p_user_id,
    p_round_id,
    p_bet_type,
    v_bet_value,
    p_amount,
    p_odds,
    'pending',
    0
  )
  returning id into v_bet_id;

  insert into public.point_transactions (
    user_id,
    amount,
    balance_before,
    balance_after,
    type,
    related_id,
    related_type,
    description
  ) values (
    p_user_id,
    -p_amount,
    v_balance,
    v_balance - p_amount,
    'bet',
    v_bet_id,
    'game_bets',
    'Game bet placed'
  );

  return v_bet_id;
end;
$$;
