create or replace function public.check_phone_duplicate(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_exists boolean;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  if v_phone = '' then
    return false;
  end if;

  select exists(
    select 1
    from public.user_profiles
    where deleted_at is null
      and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = v_phone
  ) into v_exists;

  return v_exists;
end;
$$;

create or replace function public.heartbeat_session()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_timeout_minutes integer;
begin
  if v_uid is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  update public.admins
  set last_active_at = now(), updated_at = now()
  where id = v_uid and coalesce(is_active, true) = true
  returning 'admin' into v_role;

  if v_role is null then
    update public.agents
    set last_active_at = now(), updated_at = now()
    where id = v_uid and coalesce(is_active, true) = true
    returning 'agent' into v_role;
  end if;

  if v_role is null then
    update public.user_profiles
    set last_active_at = now(), last_activity = now(), is_online = true, updated_at = now()
    where id = v_uid and status = 'active'
    returning 'user' into v_role;
  end if;

  if v_role is null then
    return json_build_object('valid', false, 'reason', 'account_not_found');
  end if;

  select coalesce(nullif(value, '')::integer, 30)
  into v_timeout_minutes
  from public.system_settings
  where key = 'session_timeout_' || v_role;

  return json_build_object('valid', true, 'role', v_role, 'timeout_minutes', coalesce(v_timeout_minutes, 30));
end;
$$;

create or replace function public.check_session_valid()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_last_active timestamptz;
  v_timeout_minutes integer;
  v_elapsed_minutes double precision;
begin
  if v_uid is null then
    return json_build_object('valid', false, 'reason', 'not_authenticated');
  end if;

  select 'admin', last_active_at
  into v_role, v_last_active
  from public.admins
  where id = v_uid and coalesce(is_active, true) = true;

  if v_role is null then
    select 'agent', last_active_at
    into v_role, v_last_active
    from public.agents
    where id = v_uid and coalesce(is_active, true) = true;
  end if;

  if v_role is null then
    select 'user', last_active_at
    into v_role, v_last_active
    from public.user_profiles
    where id = v_uid and status = 'active';
  end if;

  if v_role is null then
    return json_build_object('valid', false, 'reason', 'account_not_found');
  end if;

  if v_last_active is null then
    return json_build_object('valid', true, 'role', v_role);
  end if;

  select coalesce(nullif(value, '')::integer, 30)
  into v_timeout_minutes
  from public.system_settings
  where key = 'session_timeout_' || v_role;

  v_timeout_minutes := coalesce(v_timeout_minutes, 30);
  v_elapsed_minutes := extract(epoch from (now() - v_last_active)) / 60.0;

  if v_elapsed_minutes > v_timeout_minutes then
    return json_build_object(
      'valid', false,
      'reason', 'session_expired',
      'elapsed_minutes', round(v_elapsed_minutes::numeric, 1),
      'timeout_minutes', v_timeout_minutes
    );
  end if;

  return json_build_object('valid', true, 'role', v_role);
end;
$$;

create or replace function public.get_agent_referral_code_logs(p_agent_id uuid)
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
  select
    pt.id,
    pt.user_id,
    pt.type,
    pt.amount,
    pt.created_at,
    pt.related_id,
    pt.related_type,
    up.name,
    up.nickname
  from public.point_transactions pt
  left join public.user_profiles up on up.id = pt.user_id
  where pt.user_id = any(coalesce(p_member_ids, array[]::uuid[]))
    and pt.type::text = any(coalesce(p_types, array[]::text[]))
  order by pt.created_at desc;
end;
$$;

revoke execute on function public.check_phone_duplicate(text) from public;
revoke execute on function public.heartbeat_session() from public;
revoke execute on function public.check_session_valid() from public;
revoke execute on function public.get_agent_referral_code_logs(uuid) from public;
revoke execute on function public.get_agent_member_transactions(uuid[], text[]) from public;

grant execute on function public.check_phone_duplicate(text) to anon, authenticated;
grant execute on function public.heartbeat_session() to authenticated;
grant execute on function public.check_session_valid() to authenticated;
grant execute on function public.get_agent_referral_code_logs(uuid) to authenticated;
grant execute on function public.get_agent_member_transactions(uuid[], text[]) to authenticated;
