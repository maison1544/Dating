create extension if not exists pg_cron with schema extensions;

create or replace function private.cron_game_tick(p_game_type text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.game_tick(p_game_type);
end;
$$;

create or replace function public.cron_game_tick(p_game_type text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Forbidden';
  end if;

  return private.cron_game_tick(p_game_type);
end;
$$;

revoke all on function public.cron_game_tick(text) from public, anon, authenticated;
grant execute on function public.cron_game_tick(text) to service_role;

revoke execute on function public.game_tick_client() from public, anon, authenticated;
revoke execute on function public.game_tick_client(text) from public, anon, authenticated;
revoke execute on function private.game_tick_client(text) from anon, authenticated;

select cron.unschedule('dating-minigame-game-tick-30s')
where exists (
  select 1
  from cron.job
  where jobname = 'dating-minigame-game-tick-30s'
);

select cron.schedule(
  'dating-minigame-game-tick-30s',
  '30 seconds',
  $$select private.cron_game_tick(null::text);$$
);
