create or replace function private.get_agent_referral_code_logs(p_agent_id uuid)
returns table(id uuid, target_id uuid, changes jsonb, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and auth.uid() is distinct from p_agent_id then
    raise exception 'Forbidden';
  end if;

  return query
  select aal.id, aal.target_id, aal.changes, aal.created_at
  from public.admin_action_logs aal
  where aal.action = 'change_user_referral_code'
    and (
      aal.changes->>'fromAgentId' = p_agent_id::text
      or aal.changes->>'toAgentId' = p_agent_id::text
    )
  order by aal.created_at desc;
end;
$$;

create or replace function public.get_agent_referral_code_logs(p_agent_id uuid)
returns table(id uuid, target_id uuid, changes jsonb, created_at timestamptz)
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and auth.uid() is distinct from p_agent_id then
    raise exception 'Forbidden';
  end if;

  return query select * from private.get_agent_referral_code_logs(p_agent_id);
end;
$$;

create or replace function private.get_agent_member_transactions(p_member_ids uuid[], p_types text[])
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and not private.is_agent() then
    raise exception 'Forbidden';
  end if;

  return query
  select pt.id, pt.user_id, pt.type, pt.amount, pt.created_at, pt.related_id, pt.related_type, up.name, up.nickname
  from public.point_transactions pt
  left join public.user_profiles up on up.id = pt.user_id
  where pt.user_id = any(coalesce(p_member_ids, array[]::uuid[]))
    and pt.type::text = any(coalesce(p_types, array[]::text[]))
    and (private.is_service_role() or private.is_admin() or up.agent_id = auth.uid())
  order by pt.created_at desc;
end;
$$;

create or replace function public.get_agent_member_transactions(p_member_ids uuid[], p_types text[])
returns table(
  id uuid,
  user_id uuid,
  type varchar,
  amount bigint,
  created_at timestamptz,
  related_id uuid,
  related_type varchar,
  user_name varchar,
  user_nickname varchar
)
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if auth.uid() is null and not private.is_service_role() then
    raise exception 'Not authenticated';
  end if;

  if not private.is_service_role() and not private.is_admin() and not private.is_agent() then
    raise exception 'Forbidden';
  end if;

  return query select * from private.get_agent_member_transactions(p_member_ids, p_types);
end;
$$;

grant execute on function private.get_agent_referral_code_logs(uuid) to authenticated;
grant execute on function private.get_agent_member_transactions(uuid[], text[]) to authenticated;
revoke execute on function public.get_agent_referral_code_logs(uuid) from public, anon;
revoke execute on function public.get_agent_member_transactions(uuid[], text[]) from public, anon;
grant execute on function public.get_agent_referral_code_logs(uuid) to authenticated;
grant execute on function public.get_agent_member_transactions(uuid[], text[]) to authenticated;
