create or replace function private.admin_game_rounds_count(
  p_game_type text default null,
  p_start_time timestamp with time zone default null,
  p_end_time timestamp with time zone default null
)
returns bigint
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_count bigint;
begin
  if not private.is_service_role() and (auth.uid() is null or not private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  select count(*)
  into v_count
  from public.game_rounds gr
  where (p_game_type is null or gr.game_type = p_game_type)
    and (p_start_time is null or gr.start_time >= p_start_time)
    and (p_end_time is null or gr.start_time <= p_end_time);

  return coalesce(v_count, 0);
end;
$$;

create or replace function private.admin_game_rounds_list(
  p_game_type text default null,
  p_start_time timestamp with time zone default null,
  p_end_time timestamp with time zone default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.game_rounds
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_service_role() and (auth.uid() is null or not private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  return query
  select gr.*
  from public.game_rounds gr
  where (p_game_type is null or gr.game_type = p_game_type)
    and (p_start_time is null or gr.start_time >= p_start_time)
    and (p_end_time is null or gr.start_time <= p_end_time)
  order by gr.start_time desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_game_rounds_count(
  p_game_type text default null,
  p_start_time timestamp with time zone default null,
  p_end_time timestamp with time zone default null
)
returns bigint
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if not private.is_service_role() and (auth.uid() is null or not private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  return private.admin_game_rounds_count(p_game_type, p_start_time, p_end_time);
end;
$$;

create or replace function public.admin_game_rounds_list(
  p_game_type text default null,
  p_start_time timestamp with time zone default null,
  p_end_time timestamp with time zone default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.game_rounds
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if not private.is_service_role() and (auth.uid() is null or not private.is_admin()) then
    raise exception 'Forbidden';
  end if;

  return query
  select * from private.admin_game_rounds_list(
    p_game_type,
    p_start_time,
    p_end_time,
    p_limit,
    p_offset
  );
end;
$$;

grant execute on function private.admin_game_rounds_count(text, timestamp with time zone, timestamp with time zone) to authenticated, service_role;
grant execute on function private.admin_game_rounds_list(text, timestamp with time zone, timestamp with time zone, integer, integer) to authenticated, service_role;
grant execute on function public.admin_game_rounds_count(text, timestamp with time zone, timestamp with time zone) to authenticated, service_role;
grant execute on function public.admin_game_rounds_list(text, timestamp with time zone, timestamp with time zone, integer, integer) to authenticated, service_role;
