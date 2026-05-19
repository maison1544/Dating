create or replace function private.game_rounds_secure_list(
  p_game_type text default null,
  p_statuses text[] default null,
  p_round_id uuid default null,
  p_limit integer default 20,
  p_betting_open_only boolean default false
)
returns table (
  id uuid,
  game_type varchar,
  round_number text,
  status varchar,
  start_time timestamp with time zone,
  betting_end_time timestamp with time zone,
  end_time timestamp with time zone,
  total_bet_amount bigint,
  total_win_amount bigint,
  profit bigint,
  is_settled boolean,
  settled_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  reserved_by uuid,
  reserved_at timestamp with time zone,
  result jsonb,
  reserved_result jsonb
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  return query
  select
    gr.id,
    gr.game_type,
    gr.round_number::text,
    gr.status,
    gr.start_time,
    gr.betting_end_time,
    gr.end_time,
    gr.total_bet_amount,
    gr.total_win_amount,
    gr.profit,
    gr.is_settled,
    gr.settled_at,
    gr.created_at,
    gr.updated_at,
    case when private.is_admin() then gr.reserved_by else null::uuid end,
    case when private.is_admin() then gr.reserved_at else null::timestamp with time zone end,
    case
      when gr.status in ('completed', 'settled') then gr.result
      when private.is_admin() then gr.result
      else null::jsonb
    end,
    case when private.is_admin() then gr.reserved_result else null::jsonb end
  from public.game_rounds gr
  where (p_game_type is null or gr.game_type = p_game_type)
    and (p_statuses is null or gr.status = any(p_statuses))
    and (p_round_id is null or gr.id = p_round_id)
    and (not p_betting_open_only or gr.betting_end_time >= now())
  order by gr.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
end;
$$;

create or replace function public.game_rounds_secure_list(
  p_game_type text default null,
  p_statuses text[] default null,
  p_round_id uuid default null,
  p_limit integer default 20,
  p_betting_open_only boolean default false
)
returns table (
  id uuid,
  game_type varchar,
  round_number text,
  status varchar,
  start_time timestamp with time zone,
  betting_end_time timestamp with time zone,
  end_time timestamp with time zone,
  total_bet_amount bigint,
  total_win_amount bigint,
  profit bigint,
  is_settled boolean,
  settled_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  reserved_by uuid,
  reserved_at timestamp with time zone,
  result jsonb,
  reserved_result jsonb
)
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  return query
  select * from private.game_rounds_secure_list(
    p_game_type,
    p_statuses,
    p_round_id,
    p_limit,
    p_betting_open_only
  );
end;
$$;

revoke all on function private.game_rounds_secure_list(text, text[], uuid, integer, boolean) from public;
grant execute on function private.game_rounds_secure_list(text, text[], uuid, integer, boolean) to anon, authenticated, service_role;

revoke all on function public.game_rounds_secure_list(text, text[], uuid, integer, boolean) from public;
grant execute on function public.game_rounds_secure_list(text, text[], uuid, integer, boolean) to anon, authenticated, service_role;
