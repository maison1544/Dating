drop view if exists public.game_rounds_secure;

create view public.game_rounds_secure as
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
  reserved_by,
  reserved_at,
  case
    when status in ('completed', 'settled') then result
    when private.is_admin() then result
    else null::jsonb
  end as result,
  case
    when private.is_admin() then reserved_result
    else null::jsonb
  end as reserved_result
from public.game_rounds;

revoke all on public.game_rounds_secure from public, anon, authenticated;
grant select on public.game_rounds_secure to anon, authenticated;

revoke all on public.game_rounds from anon, authenticated;
grant select (
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
  updated_at
) on public.game_rounds to anon, authenticated;
grant update on public.game_rounds to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime drop table public.game_rounds;
  exception
    when undefined_object then null;
  end;

  alter publication supabase_realtime add table public.game_rounds (
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
    updated_at
  );
end;
$$;
