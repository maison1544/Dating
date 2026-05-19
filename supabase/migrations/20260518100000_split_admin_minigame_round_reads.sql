drop view if exists public.game_rounds_secure;

create view public.game_rounds_secure
with (security_invoker = true) as
select
  id,
  game_type,
  round_number,
  status,
  start_time,
  betting_end_time,
  end_time,
  total_bet_amount,
  total_win_amount,
  profit,
  is_settled,
  settled_at,
  created_at,
  updated_at,
  null::uuid as reserved_by,
  null::timestamptz as reserved_at,
  case
    when status in ('completed', 'settled') then result
    else null::jsonb
  end as result,
  null::jsonb as reserved_result
from public.game_rounds;

revoke all on public.game_rounds_secure from public, anon, authenticated;
grant select on public.game_rounds_secure to anon, authenticated;

grant select (result) on public.game_rounds to anon, authenticated;

create or replace function private.admin_game_rounds_count(
  p_game_type text default null,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  if auth.uid() is null or not private.is_admin() then
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

create or replace function public.admin_game_rounds_count(
  p_game_type text default null,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null
)
returns bigint
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  return private.admin_game_rounds_count(p_game_type, p_start_time, p_end_time);
end;
$$;

create or replace function private.admin_game_rounds_list(
  p_game_type text default null,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.game_rounds
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not private.is_admin() then
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

create or replace function public.admin_game_rounds_list(
  p_game_type text default null,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.game_rounds
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null or not private.is_admin() then
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

revoke execute on function private.admin_game_rounds_count(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function private.admin_game_rounds_list(text, timestamptz, timestamptz, integer, integer) from public, anon, authenticated;
revoke execute on function public.admin_game_rounds_count(text, timestamptz, timestamptz) from public, anon;
revoke execute on function public.admin_game_rounds_list(text, timestamptz, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_game_rounds_count(text, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_game_rounds_list(text, timestamptz, timestamptz, integer, integer) to authenticated;
