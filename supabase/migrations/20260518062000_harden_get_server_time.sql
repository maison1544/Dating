create or replace function public.get_server_time()
returns timestamptz
language sql
security invoker
set search_path = public
as $$
  select now();
$$;

revoke execute on function public.get_server_time() from public;
grant execute on function public.get_server_time() to anon, authenticated;
