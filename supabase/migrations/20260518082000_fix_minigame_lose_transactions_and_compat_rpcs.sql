create or replace function public.admin_force_process_round(p_round_id uuid, p_result jsonb default null)
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

create or replace function public.game_tick()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.game_tick(null::text)::json;
end;
$$;

create or replace function public.game_tick_client()
returns json
language plpgsql
security invoker
set search_path = public
as $$
begin
  return public.game_tick_client(null::text)::json;
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
security definer
set search_path = public
as $$
begin
  return public.place_bet(p_user_id, p_round_id, p_bet_type, p_amount::numeric, p_odds, null::text);
end;
$$;

update public.point_transactions
set amount = 0,
    balance_after = balance_before
where type = 'lose'
  and amount <> 0
  and related_type = 'game_bets';

revoke execute on function public.admin_force_process_round(uuid, jsonb) from public;
revoke execute on function public.game_tick() from public;
revoke execute on function public.game_tick_client() from public;
revoke execute on function public.place_bet(uuid, uuid, text, integer, numeric) from public;

grant execute on function public.admin_force_process_round(uuid, jsonb) to authenticated;
grant execute on function public.game_tick_client() to anon, authenticated;
grant execute on function public.place_bet(uuid, uuid, text, integer, numeric) to authenticated;
