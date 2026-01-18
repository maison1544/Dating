alter table public.chat_profiles
  add column if not exists image_object_id uuid;

alter table public.chat_profiles
  drop constraint if exists chat_profiles_image_object_id_fkey;

alter table public.chat_profiles
  add constraint chat_profiles_image_object_id_fkey
  foreign key (image_object_id)
  references storage.objects(id)
  on delete set null;

create or replace function public.chat_profiles_enforce_active_online()
returns trigger
language plpgsql
security definer
set search_path to 'public'
set row_security to 'off'
as $$
begin
  if new.is_active is false then
    new.is_online := false;
  end if;

  if new.is_online is true and new.is_active is false then
    new.is_online := false;
  end if;

  return new;
end;
$$;

drop trigger if exists chat_profiles_enforce_active_online on public.chat_profiles;
create trigger chat_profiles_enforce_active_online
before insert or update on public.chat_profiles
for each row
execute function public.chat_profiles_enforce_active_online();

create or replace function public.recalc_chat_profile_counters(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
set row_security to 'off'
as $$
declare
  v_total_chats bigint;
  v_active_chats bigint;
  v_total_messages bigint;
  v_chat_requests bigint;
  v_gifts bigint;
  v_gift_value bigint;
begin
  if p_profile_id is null then
    return;
  end if;

  select count(*)::bigint
  into v_total_chats
  from public.chat_rooms cr
  where cr.profile_id = p_profile_id;

  select count(*)::bigint
  into v_active_chats
  from public.chat_rooms cr
  where cr.profile_id = p_profile_id
    and coalesce(cr.status, 'active') = 'active'
    and coalesce(cr.is_active, true) = true;

  select count(*)::bigint
  into v_total_messages
  from public.messages m
  join public.chat_rooms cr on cr.id = m.room_id
  where cr.profile_id = p_profile_id;

  v_chat_requests := v_total_chats;

  select coalesce(sum(greatest(coalesce(gt.quantity, 1), 1)), 0)::bigint,
         coalesce(sum(coalesce(gt.points_amount, 0)), 0)::bigint
    into v_gifts, v_gift_value
  from public.gift_transactions gt
  where gt.receiver_type = 'profile'
    and gt.receiver_id = p_profile_id;

  update public.chat_profiles cp
  set total_chats = v_total_chats::integer,
      active_chats = v_active_chats::integer,
      total_messages = v_total_messages::integer,
      chat_request_count = v_chat_requests::integer,
      total_gifts_received = v_gifts::integer,
      total_gift_value = v_gift_value
  where cp.id = p_profile_id;
end;
$$;

create or replace function public.chat_rooms_after_change_update_profile_counters()
returns trigger
language plpgsql
security definer
set search_path to 'public'
set row_security to 'off'
as $$
declare
  v_old_active boolean;
  v_new_active boolean;
begin
  if tg_op = 'INSERT' then
    perform public.recalc_chat_profile_counters(new.profile_id);
    return null;
  elsif tg_op = 'DELETE' then
    perform public.recalc_chat_profile_counters(old.profile_id);
    return null;
  end if;

  if new.profile_id is distinct from old.profile_id then
    perform public.recalc_chat_profile_counters(old.profile_id);
    perform public.recalc_chat_profile_counters(new.profile_id);
    return null;
  end if;

  v_old_active := (coalesce(old.status, 'active') = 'active' and coalesce(old.is_active, true) = true);
  v_new_active := (coalesce(new.status, 'active') = 'active' and coalesce(new.is_active, true) = true);

  if v_old_active is distinct from v_new_active then
    perform public.recalc_chat_profile_counters(new.profile_id);
  end if;

  return null;
end;
$$;

drop trigger if exists chat_rooms_after_change_update_profile_counters on public.chat_rooms;
create trigger chat_rooms_after_change_update_profile_counters
after insert or update or delete on public.chat_rooms
for each row
execute function public.chat_rooms_after_change_update_profile_counters();

create or replace function public.messages_after_change_update_profile_counters()
returns trigger
language plpgsql
security definer
set search_path to 'public'
set row_security to 'off'
as $$
declare
  v_room_id uuid;
  v_profile_id uuid;
begin
  if tg_op = 'INSERT' then
    v_room_id := new.room_id;
  else
    v_room_id := old.room_id;
  end if;

  select cr.profile_id
    into v_profile_id
  from public.chat_rooms cr
  where cr.id = v_room_id;

  perform public.recalc_chat_profile_counters(v_profile_id);

  return null;
end;
$$;

drop trigger if exists messages_after_change_update_profile_counters on public.messages;
create trigger messages_after_change_update_profile_counters
after insert or delete on public.messages
for each row
execute function public.messages_after_change_update_profile_counters();

do $$
declare
  r record;
begin
  for r in select id from public.chat_profiles loop
    perform public.recalc_chat_profile_counters(r.id);
  end loop;
end $$;
