create or replace function private.game_chat_list(p_game_type text, p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_res jsonb;
begin
  if p_game_type is null or p_game_type not in ('powerball', 'ladder') then
    raise exception 'Invalid game type';
  end if;

  select jsonb_agg(to_jsonb(t) order by t.created_at asc)
  into v_res
  from (
    select gc.id, gc.created_at, gc.message, gc.game_type, gc.user_id, coalesce(up.nickname, up.name, '익명') as nickname
    from public.game_chats gc
    left join public.user_profiles up on up.id = gc.user_id
    where gc.game_type = p_game_type
    order by gc.created_at desc
    limit v_limit
  ) t;

  return coalesce(v_res, '[]'::jsonb);
end;
$$;

create or replace function public.game_chat_list(p_game_type text, p_limit integer default 50)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.game_chat_list(p_game_type, p_limit);
end;
$$;

create or replace function private.game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  if p_id is null then
    raise exception 'Missing id';
  end if;

  select to_jsonb(t)
  into v_res
  from (
    select gc.id, gc.created_at, gc.message, gc.game_type, gc.user_id, coalesce(up.nickname, up.name, '익명') as nickname
    from public.game_chats gc
    left join public.user_profiles up on up.id = gc.user_id
    where gc.id = p_id
  ) t;

  if v_res is null then
    raise exception 'Not found';
  end if;

  return v_res;
end;
$$;

create or replace function public.game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.game_chat_get(p_id);
end;
$$;

create or replace function private.game_chat_send(p_game_type text, p_message text)
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

  if p_game_type is null or p_game_type not in ('powerball', 'ladder') then
    raise exception 'Invalid game type';
  end if;

  if p_message is null or btrim(p_message) = '' then
    raise exception 'Empty message';
  end if;

  insert into public.game_chats (game_type, user_id, message)
  values (p_game_type, v_user_id, left(btrim(p_message), 500))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.game_chat_send(p_game_type text, p_message text)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return private.game_chat_send(p_game_type, p_message);
end;
$$;

grant execute on function private.game_chat_list(text, integer) to authenticated;
grant execute on function private.game_chat_get(uuid) to authenticated;
grant execute on function private.game_chat_send(text, text) to authenticated;
revoke execute on function public.game_chat_list(text, integer) from public, anon;
revoke execute on function public.game_chat_get(uuid) from public, anon;
revoke execute on function public.game_chat_send(text, text) from public, anon;
grant execute on function public.game_chat_list(text, integer) to authenticated;
grant execute on function public.game_chat_get(uuid) to authenticated;
grant execute on function public.game_chat_send(text, text) to authenticated;
