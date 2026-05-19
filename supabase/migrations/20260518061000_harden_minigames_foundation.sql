drop view if exists public.game_rounds_secure;

create view public.game_rounds_secure
with (security_invoker = true) as
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

revoke all on public.game_rounds_secure from public;
grant select on public.game_rounds_secure to anon, authenticated;

revoke execute on function public.admin_game_tick(text) from public, anon;
revoke execute on function public.game_chat_get(uuid) from public, anon;
revoke execute on function public.game_chat_list(text, integer) from public, anon;
revoke execute on function public.game_chat_send(text, text) from public, anon;
revoke execute on function public.game_generate_result_ladder() from public, anon, authenticated;
revoke execute on function public.game_generate_result_powerball() from public, anon, authenticated;
revoke execute on function public.game_resolve_auto_ladder(jsonb) from public, anon, authenticated;
revoke execute on function public.game_resolve_auto_powerball(jsonb) from public, anon, authenticated;
revoke execute on function public.game_check_bet_won(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.game_tick(text) from public, anon, authenticated;
revoke execute on function public.game_tick_client(text) from public, anon;
revoke execute on function public.get_server_time() from public;
revoke execute on function public.ladder_game_chat_get(uuid) from public, anon;
revoke execute on function public.ladder_game_chat_list(integer) from public, anon;
revoke execute on function public.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) from public, anon;
revoke execute on function public.ladder_game_chat_send(text) from public, anon;
revoke execute on function public.place_bet(uuid, uuid, text, numeric, numeric, text) from public, anon;
revoke execute on function public.powerball_game_chat_get(uuid) from public, anon;
revoke execute on function public.powerball_game_chat_list(integer) from public, anon;
revoke execute on function public.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) from public, anon;
revoke execute on function public.powerball_game_chat_send(text) from public, anon;

grant execute on function public.admin_game_tick(text) to authenticated;
grant execute on function public.game_chat_get(uuid) to authenticated;
grant execute on function public.game_chat_list(text, integer) to authenticated;
grant execute on function public.game_chat_send(text, text) to authenticated;
grant execute on function public.game_tick_client(text) to authenticated;
grant execute on function public.get_server_time() to anon, authenticated;
grant execute on function public.ladder_game_chat_get(uuid) to authenticated;
grant execute on function public.ladder_game_chat_list(integer) to authenticated;
grant execute on function public.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
grant execute on function public.ladder_game_chat_send(text) to authenticated;
grant execute on function public.place_bet(uuid, uuid, text, numeric, numeric, text) to authenticated;
grant execute on function public.powerball_game_chat_get(uuid) to authenticated;
grant execute on function public.powerball_game_chat_list(integer) to authenticated;
grant execute on function public.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
grant execute on function public.powerball_game_chat_send(text) to authenticated;
