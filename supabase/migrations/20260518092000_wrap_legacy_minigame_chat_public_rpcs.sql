create or replace function private.ladder_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_res jsonb;
begin
  select jsonb_agg(to_jsonb(t) order by t.created_at asc)
  into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.ladder_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    order by c.created_at desc
    limit v_limit
  ) t;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.ladder_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.ladder_game_chat_list(p_limit);
end;
$$;

create or replace function private.powerball_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_res jsonb;
begin
  select jsonb_agg(to_jsonb(t) order by t.created_at asc)
  into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.powerball_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    order by c.created_at desc
    limit v_limit
  ) t;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.powerball_game_chat_list(p_limit integer default 50)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.powerball_game_chat_list(p_limit);
end;
$$;

create or replace function private.ladder_game_chat_send(p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.ladder_game_chats(user_id, message)
  values (v_user_id, left(btrim(p_message), 500))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.ladder_game_chat_send(p_message text)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return private.ladder_game_chat_send(p_message);
end;
$$;

create or replace function private.powerball_game_chat_send(p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.powerball_game_chats(user_id, message)
  values (v_user_id, left(btrim(p_message), 500))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.powerball_game_chat_send(p_message text)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return private.powerball_game_chat_send(p_message);
end;
$$;

grant execute on function private.ladder_game_chat_list(integer) to authenticated;
grant execute on function private.powerball_game_chat_list(integer) to authenticated;
grant execute on function private.ladder_game_chat_send(text) to authenticated;
grant execute on function private.powerball_game_chat_send(text) to authenticated;
revoke execute on function public.ladder_game_chat_list(integer) from public, anon;
revoke execute on function public.powerball_game_chat_list(integer) from public, anon;
revoke execute on function public.ladder_game_chat_send(text) from public, anon;
revoke execute on function public.powerball_game_chat_send(text) from public, anon;
grant execute on function public.ladder_game_chat_list(integer) to authenticated;
grant execute on function public.powerball_game_chat_list(integer) to authenticated;
grant execute on function public.ladder_game_chat_send(text) to authenticated;
grant execute on function public.powerball_game_chat_send(text) to authenticated;
