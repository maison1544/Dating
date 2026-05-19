create or replace function private.ladder_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  select to_jsonb(t)
  into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.ladder_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    where c.id = p_id
  ) t;

  if v_res is null then
    raise exception 'Not found';
  end if;

  return v_res;
end;
$$;

create or replace function public.ladder_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.ladder_game_chat_get(p_id);
end;
$$;

create or replace function private.powerball_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  select to_jsonb(t)
  into v_res
  from (
    select c.id, c.created_at, c.message, coalesce(up.nickname, up.name, '익명') as nickname
    from public.powerball_game_chats c
    left join public.user_profiles up on up.id = c.user_id
    where c.id = p_id
  ) t;

  if v_res is null then
    raise exception 'Not found';
  end if;

  return v_res;
end;
$$;

create or replace function public.powerball_game_chat_get(p_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return private.powerball_game_chat_get(p_id);
end;
$$;

create or replace function private.ladder_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  with t as (
    select c.id, c.created_at, c.user_id, coalesce(u.nickname, u.name, '알 수 없음') as nickname, c.message
    from public.game_chats c
    left join public.user_profiles u on c.user_id = u.id
    where c.user_id = p_user_id
      and c.game_type = 'ladder'
      and (p_from is null or c.created_at >= p_from)
      and (p_to is null or c.created_at <= p_to)
      and (private.is_admin() or u.agent_id = auth.uid())
    order by c.created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 500)
  )
  select coalesce(json_agg(row_to_json(t) order by t.created_at asc), '[]'::json)
  into v
  from t;

  return v;
end;
$$;

create or replace function public.ladder_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  return private.ladder_game_chat_list_admin(p_user_id, p_limit, p_from, p_to);
end;
$$;

create or replace function private.powerball_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  with t as (
    select c.id, c.created_at, c.user_id, coalesce(u.nickname, u.name, '알 수 없음') as nickname, c.message
    from public.game_chats c
    left join public.user_profiles u on c.user_id = u.id
    where c.user_id = p_user_id
      and c.game_type = 'powerball'
      and (p_from is null or c.created_at >= p_from)
      and (p_to is null or c.created_at <= p_to)
      and (private.is_admin() or u.agent_id = auth.uid())
    order by c.created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 500)
  )
  select coalesce(json_agg(row_to_json(t) order by t.created_at asc), '[]'::json)
  into v
  from t;

  return v;
end;
$$;

create or replace function public.powerball_game_chat_list_admin(
  p_user_id uuid,
  p_limit integer default 200,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns json
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null or (not private.is_admin() and not private.is_agent()) then
    raise exception '관리자 권한이 필요합니다';
  end if;

  return private.powerball_game_chat_list_admin(p_user_id, p_limit, p_from, p_to);
end;
$$;

grant execute on function private.ladder_game_chat_get(uuid) to authenticated;
grant execute on function private.powerball_game_chat_get(uuid) to authenticated;
grant execute on function private.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
grant execute on function private.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
revoke execute on function public.ladder_game_chat_get(uuid) from public, anon;
revoke execute on function public.powerball_game_chat_get(uuid) from public, anon;
revoke execute on function public.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) from public, anon;
revoke execute on function public.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) from public, anon;
grant execute on function public.ladder_game_chat_get(uuid) to authenticated;
grant execute on function public.powerball_game_chat_get(uuid) to authenticated;
grant execute on function public.ladder_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
grant execute on function public.powerball_game_chat_list_admin(uuid, integer, timestamptz, timestamptz) to authenticated;
