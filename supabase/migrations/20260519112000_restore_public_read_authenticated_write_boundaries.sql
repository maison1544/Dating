do $$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    to_regprocedure('public.place_bet(uuid, uuid, text, integer, numeric)'),
    to_regprocedure('public.place_bet(uuid, uuid, text, numeric, numeric, text)'),
    to_regprocedure('public.game_chat_send(text, text)'),
    to_regprocedure('public.chat_send_message(uuid, text, text)'),
    to_regprocedure('public.chat_send_message(uuid, text, text, text, uuid, integer)'),
    to_regprocedure('public.create_or_get_chat_room(uuid)')
  ]
  loop
    if fn is not null then
      execute format('revoke execute on function %s from public, anon', fn);
      execute format('grant execute on function %s to authenticated', fn);
    end if;
  end loop;

  foreach fn in array array[
    to_regprocedure('public.game_chat_list(text, integer)'),
    to_regprocedure('public.game_rounds_secure_list(text, text[], uuid, integer, boolean)'),
    to_regprocedure('public.game_tick_client()'),
    to_regprocedure('public.game_tick_client(text)'),
    to_regprocedure('public.get_server_time()')
  ]
  loop
    if fn is not null then
      execute format('grant execute on function %s to anon, authenticated', fn);
    end if;
  end loop;
end;
$$;

drop policy if exists "Authenticated users can view game chats" on public.game_chats;
create policy "Anyone can view game chats"
on public.game_chats
for select
to anon, authenticated
using (true);
