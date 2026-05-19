grant execute on function private.place_bet(uuid, uuid, text, numeric, numeric, text) to authenticated, service_role;
grant execute on function private.admin_game_rounds_count(text, timestamp with time zone, timestamp with time zone) to authenticated, service_role;
grant execute on function private.admin_game_rounds_list(text, timestamp with time zone, timestamp with time zone, integer, integer) to authenticated, service_role;
