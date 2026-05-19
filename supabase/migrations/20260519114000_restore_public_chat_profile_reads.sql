drop policy if exists chat_profiles_select on public.chat_profiles;
create policy chat_profiles_select
on public.chat_profiles
for select
to anon, authenticated
using (
  (coalesce(is_active, true) = true and deleted_at is null)
  or private.is_admin()
  or private.agent_owns_chat_profile(id)
  or exists (
    select 1
    from public.chat_rooms cr
    where cr.profile_id = chat_profiles.id
      and cr.user_id = (select auth.uid())
  )
);

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

drop function if exists public.place_bet(uuid, uuid, text, integer, numeric);

drop policy if exists game_chats_select_authenticated on public.game_chats;
drop policy if exists "Authenticated users can view game chats" on public.game_chats;
drop policy if exists "Anyone can view game chats" on public.game_chats;
create policy game_chats_select_public
on public.game_chats
for select
to anon, authenticated
using (true);
