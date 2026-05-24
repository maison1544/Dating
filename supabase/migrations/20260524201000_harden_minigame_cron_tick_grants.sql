revoke all on function private.cron_game_tick(text) from public, anon, authenticated;
grant execute on function private.cron_game_tick(text) to postgres;

revoke all on function public.cron_game_tick(text) from public, anon, authenticated;
grant execute on function public.cron_game_tick(text) to service_role;
