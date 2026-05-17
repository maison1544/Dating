create table public.chat_profiles (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  age integer not null,
  bio text,
  interests jsonb default '[]'::jsonb,
  image varchar,
  image_object_id uuid,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  assigned_by_admin_id uuid references public.admins(id) on delete set null,
  is_active boolean default true,
  is_online boolean default false,
  total_chats integer default 0,
  active_chats integer default 0,
  total_messages integer default 0,
  chat_request_count integer default 0,
  chat_cost integer default 100 check (chat_cost is null or chat_cost >= 0),
  total_gifts_received integer default 0,
  total_gift_value bigint default 0,
  job varchar,
  height integer,
  weight integer,
  deleted_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  profile_id uuid not null references public.chat_profiles(id) on delete restrict,
  status varchar default 'active' check (status in ('active', 'closed', 'archived')),
  last_message text,
  last_message_at timestamptz,
  last_message_sender_type varchar check (last_message_sender_type is null or last_message_sender_type in ('user', 'profile')),
  is_active boolean default true,
  unread_count integer default 0,
  profile_unread_count integer default 0,
  user_gifts_count integer default 0,
  user_gifts_value bigint default 0,
  profile_gifts_count integer default 0,
  profile_gifts_value bigint default 0,
  created_at timestamptz default now(),
  unique (user_id, profile_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null,
  sender_type varchar not null check (sender_type in ('user', 'profile')),
  content text,
  message text not null,
  message_type varchar default 'text' check (message_type in ('text', 'image', 'gift', 'system')),
  type varchar default 'text',
  gift_id uuid references public.gifts(id) on delete set null,
  gift_quantity integer default 1 check (gift_quantity is null or gift_quantity > 0),
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table public.chat_room_history (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
  profile_id uuid not null references public.chat_profiles(id) on delete restrict,
  profile_name varchar not null,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.gift_transactions
add constraint gift_transactions_room_id_fkey
foreign key (room_id) references public.chat_rooms(id) on delete set null not valid;

create index idx_chat_profiles_active on public.chat_profiles(is_active);
create index idx_chat_profiles_agent on public.chat_profiles(assigned_agent_id);
create index idx_chat_profiles_assigned_by_admin_id on public.chat_profiles(assigned_by_admin_id);
create index idx_chat_profiles_not_deleted on public.chat_profiles(id) where deleted_at is null;
create index idx_chat_rooms_user on public.chat_rooms(user_id);
create index idx_chat_rooms_profile on public.chat_rooms(profile_id);
create index idx_chat_rooms_last_message on public.chat_rooms(last_message_at desc);
create index idx_messages_room on public.messages(room_id);
create index idx_messages_created on public.messages(created_at desc);
create index idx_messages_gift_id on public.messages(gift_id);
create index idx_chat_room_history_chat_room_id on public.chat_room_history(chat_room_id);
create index idx_chat_room_history_profile_id on public.chat_room_history(profile_id);
create index idx_chat_room_history_agent_id on public.chat_room_history(assigned_agent_id);
create index idx_chat_room_history_user_id on public.chat_room_history(user_id);
create index idx_chat_room_history_created_at on public.chat_room_history(created_at desc);
create index idx_gift_transactions_room_id on public.gift_transactions(room_id);

alter table public.chat_profiles enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.chat_room_history enable row level security;

create or replace function private.agent_owns_chat_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.chat_profiles cp
    where cp.id = p_profile_id
      and cp.assigned_agent_id = (select auth.uid())
      and private.is_agent()
  );
$$;

create or replace function private.agent_owns_chat_room(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.chat_rooms cr
    join public.chat_profiles cp on cp.id = cr.profile_id
    where cr.id = p_room_id
      and cp.assigned_agent_id = (select auth.uid())
      and private.is_agent()
  );
$$;

create or replace function private.check_chat_profile_agent_update_allowed(
  p_profile_id uuid,
  p_name text,
  p_age integer,
  p_bio text,
  p_interests jsonb,
  p_image text,
  p_image_object_id uuid,
  p_assigned_agent_id uuid,
  p_assigned_by_admin_id uuid,
  p_is_active boolean,
  p_is_online boolean,
  p_total_chats integer,
  p_active_chats integer,
  p_total_messages integer,
  p_chat_request_count integer,
  p_chat_cost integer,
  p_total_gifts_received integer,
  p_total_gift_value bigint,
  p_job text,
  p_height integer,
  p_weight integer,
  p_deleted_at timestamptz,
  p_created_at timestamptz,
  p_updated_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_current record;
begin
  select *
    into v_current
  from public.chat_profiles
  where id = p_profile_id
    and assigned_agent_id = (select auth.uid())
    and private.is_agent();

  if not found then
    return false;
  end if;

  return (
    p_name is not distinct from v_current.name::text
    and p_age is not distinct from v_current.age
    and p_bio is not distinct from v_current.bio
    and p_interests is not distinct from v_current.interests
    and p_image is not distinct from v_current.image::text
    and p_image_object_id is not distinct from v_current.image_object_id
    and p_assigned_agent_id is not distinct from v_current.assigned_agent_id
    and p_assigned_by_admin_id is not distinct from v_current.assigned_by_admin_id
    and p_is_active is not distinct from v_current.is_active
    and p_total_chats is not distinct from v_current.total_chats
    and p_active_chats is not distinct from v_current.active_chats
    and p_total_messages is not distinct from v_current.total_messages
    and p_chat_request_count is not distinct from v_current.chat_request_count
    and p_chat_cost is not distinct from v_current.chat_cost
    and p_total_gifts_received is not distinct from v_current.total_gifts_received
    and p_total_gift_value is not distinct from v_current.total_gift_value
    and p_job is not distinct from v_current.job::text
    and p_height is not distinct from v_current.height
    and p_weight is not distinct from v_current.weight
    and p_deleted_at is not distinct from v_current.deleted_at
    and p_created_at is not distinct from v_current.created_at
  );
end;
$$;

create policy "chat_profiles_select" on public.chat_profiles
for select using (
  ((select auth.uid()) is not null and coalesce(is_active, true) = true and deleted_at is null)
  or private.is_admin()
  or private.agent_owns_chat_profile(id)
  or exists (
    select 1
    from public.chat_rooms cr
    where cr.profile_id = chat_profiles.id
      and cr.user_id = (select auth.uid())
  )
);
create policy "chat_profiles_insert_admins" on public.chat_profiles
for insert with check (private.is_admin());
create policy "chat_profiles_update_admins" on public.chat_profiles
for update using (private.is_admin()) with check (private.is_admin());
create policy "chat_profiles_update_assigned_agents" on public.chat_profiles
for update using (private.agent_owns_chat_profile(id)) with check (
  private.check_chat_profile_agent_update_allowed(
    id,
    name::text,
    age,
    bio,
    interests,
    image::text,
    image_object_id,
    assigned_agent_id,
    assigned_by_admin_id,
    is_active,
    is_online,
    total_chats,
    active_chats,
    total_messages,
    chat_request_count,
    chat_cost,
    total_gifts_received,
    total_gift_value,
    job::text,
    height,
    weight,
    deleted_at,
    created_at,
    updated_at
  )
);
create policy "chat_profiles_delete_admins" on public.chat_profiles
for delete using (private.is_admin());

create policy "chat_rooms_select" on public.chat_rooms
for select using (
  user_id = (select auth.uid())
  or private.is_admin()
  or private.agent_owns_chat_room(id)
);
create policy "chat_rooms_update_admins" on public.chat_rooms
for update using (private.is_admin()) with check (private.is_admin());

create policy "messages_select" on public.messages
for select using (
  private.is_admin()
  or private.agent_owns_chat_room(room_id)
  or exists (
    select 1
    from public.chat_rooms cr
    where cr.id = messages.room_id
      and cr.user_id = (select auth.uid())
  )
);
create policy "messages_update_admins" on public.messages
for update using (private.is_admin()) with check (private.is_admin());

create policy "chat_room_history_select" on public.chat_room_history
for select using (
  private.is_admin()
  or user_id = (select auth.uid())
  or assigned_agent_id = (select auth.uid())
);

create or replace function private.recalc_chat_profile_counters(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  update public.chat_profiles cp
  set
    total_chats = coalesce((
      select count(*)::integer
      from public.chat_rooms cr
      where cr.profile_id = p_profile_id
    ), 0),
    active_chats = coalesce((
      select count(*)::integer
      from public.chat_rooms cr
      where cr.profile_id = p_profile_id
        and coalesce(cr.status, 'active') = 'active'
        and coalesce(cr.is_active, true) = true
    ), 0),
    total_messages = coalesce((
      select count(*)::integer
      from public.messages m
      join public.chat_rooms cr on cr.id = m.room_id
      where cr.profile_id = p_profile_id
    ), 0)
  where cp.id = p_profile_id;
end;
$$;

create or replace function private.chat_profiles_enforce_active_online()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
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

create or replace function private.chat_rooms_after_change_update_profile_counters()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if tg_op = 'INSERT' then
    perform private.recalc_chat_profile_counters(new.profile_id);
  elsif tg_op = 'DELETE' then
    perform private.recalc_chat_profile_counters(old.profile_id);
  elsif new.profile_id is distinct from old.profile_id then
    perform private.recalc_chat_profile_counters(old.profile_id);
    perform private.recalc_chat_profile_counters(new.profile_id);
  else
    perform private.recalc_chat_profile_counters(new.profile_id);
  end if;

  return null;
end;
$$;

create or replace function private.messages_after_change_update_profile_counters()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_profile_id uuid;
begin
  select cr.profile_id
    into v_profile_id
  from public.chat_rooms cr
  where cr.id = case when tg_op = 'INSERT' then new.room_id else old.room_id end;

  perform private.recalc_chat_profile_counters(v_profile_id);
  return null;
end;
$$;

create or replace function private.chat_room_history_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_profile record;
begin
  select id, name, assigned_agent_id
    into v_profile
  from public.chat_profiles
  where id = new.profile_id;

  insert into public.chat_room_history (
    chat_room_id,
    profile_id,
    profile_name,
    assigned_agent_id,
    user_id
  ) values (
    new.id,
    new.profile_id,
    coalesce(v_profile.name, 'Unknown'),
    v_profile.assigned_agent_id,
    new.user_id
  );

  return null;
end;
$$;

create trigger chat_profiles_enforce_active_online
before insert or update on public.chat_profiles
for each row execute function private.chat_profiles_enforce_active_online();

create trigger chat_rooms_after_change_update_profile_counters
after insert or update or delete on public.chat_rooms
for each row execute function private.chat_rooms_after_change_update_profile_counters();

create trigger messages_after_change_update_profile_counters
after insert or delete on public.messages
for each row execute function private.messages_after_change_update_profile_counters();

create trigger chat_room_history_on_insert
after insert on public.chat_rooms
for each row execute function private.chat_room_history_on_insert();

create or replace function private.create_or_get_chat_room(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room record;
  v_profile record;
  v_cost integer;
  v_before bigint;
  v_after bigint;
  v_room_id uuid;
  v_description text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_profile_id::text, 0));

  select id, status
    into v_room
  from public.chat_rooms
  where user_id = v_uid
    and profile_id = p_profile_id
  for update;

  if found then
    if v_room.status is distinct from 'active' then
      update public.chat_rooms
      set status = 'active', is_active = true
      where id = v_room.id;
    end if;

    return jsonb_build_object('room_id', v_room.id, 'is_new', false);
  end if;

  select id, name, chat_cost, is_active, deleted_at
    into v_profile
  from public.chat_profiles
  where id = p_profile_id;

  if not found or coalesce(v_profile.is_active, true) is false or v_profile.deleted_at is not null then
    raise exception 'Chat profile not found';
  end if;

  v_cost := greatest(coalesce(v_profile.chat_cost, 0), 0);

  if v_cost > 0 then
    select points
      into v_before
    from public.user_profiles
    where id = v_uid
    for update;

    if not found then
      raise exception 'User not found';
    end if;

    if v_before < v_cost then
      raise exception 'Insufficient balance';
    end if;

    v_after := v_before - v_cost;

    update public.user_profiles
    set points = v_after,
        updated_at = now()
    where id = v_uid;
  end if;

  insert into public.chat_rooms(user_id, profile_id, status, unread_count, profile_unread_count)
  values (v_uid, p_profile_id, 'active', 0, 0)
  returning id into v_room_id;

  update public.chat_profiles
  set chat_request_count = coalesce(chat_request_count, 0) + 1
  where id = p_profile_id;

  if v_cost > 0 then
    v_description := case when coalesce(v_profile.name, '') <> ''
      then '채팅 시작: ' || v_profile.name
      else '채팅 시작'
    end;

    insert into public.point_transactions (
      user_id,
      type,
      amount,
      balance_before,
      balance_after,
      description,
      related_type,
      related_id
    ) values (
      v_uid,
      'chat_start',
      -v_cost,
      v_before,
      v_after,
      v_description,
      'chat_rooms',
      v_room_id
    );
  end if;

  return jsonb_build_object('room_id', v_room_id, 'is_new', true, 'chat_cost', v_cost);
end;
$$;

create or replace function public.create_or_get_chat_room(p_profile_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.create_or_get_chat_room(p_profile_id);
end;
$$;

create or replace function private.chat_send_message(
  p_room_id uuid,
  p_sender_type text,
  p_content text,
  p_message_type text default 'text',
  p_gift_id uuid default null,
  p_gift_quantity integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room record;
  v_sender_type text := lower(coalesce(p_sender_type, ''));
  v_message_type text := lower(coalesce(p_message_type, 'text'));
  v_sender_id uuid;
  v_now timestamptz := now();
  v_msg_id uuid;
  v_message text := coalesce(p_content, '');
  v_last_message text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_sender_type not in ('user', 'profile') then
    raise exception 'Invalid sender_type';
  end if;

  if v_message_type not in ('text', 'image', 'gift', 'system') then
    raise exception 'Invalid message_type';
  end if;

  select id, user_id, profile_id
    into v_room
  from public.chat_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Chat room not found';
  end if;

  if v_sender_type = 'user' then
    if v_room.user_id <> v_uid then
      raise exception 'Forbidden';
    end if;
    v_sender_id := v_room.user_id;
  else
    if not private.agent_owns_chat_room(p_room_id) and not private.is_admin() then
      raise exception 'Forbidden';
    end if;
    v_sender_id := v_room.profile_id;
  end if;

  insert into public.messages(
    room_id,
    sender_id,
    sender_type,
    content,
    message,
    message_type,
    type,
    gift_id,
    gift_quantity,
    is_read,
    created_at
  ) values (
    p_room_id,
    v_sender_id,
    v_sender_type,
    p_content,
    v_message,
    v_message_type,
    v_message_type,
    p_gift_id,
    p_gift_quantity,
    false,
    v_now
  ) returning id into v_msg_id;

  v_last_message := case when v_message_type = 'gift' then '🎁 선물을 보냈습니다' else v_message end;

  if v_sender_type = 'profile' then
    update public.chat_rooms
    set last_message = v_last_message,
        last_message_at = v_now,
        last_message_sender_type = 'profile',
        unread_count = coalesce(unread_count, 0) + 1
    where id = p_room_id;
  else
    update public.chat_rooms
    set last_message = v_last_message,
        last_message_at = v_now,
        last_message_sender_type = 'user',
        profile_unread_count = coalesce(profile_unread_count, 0) + 1
    where id = p_room_id;
  end if;

  return v_msg_id;
end;
$$;

create or replace function public.chat_send_message(
  p_room_id uuid,
  p_sender_type text,
  p_content text,
  p_message_type text default 'text',
  p_gift_id uuid default null,
  p_gift_quantity integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.chat_send_message(p_room_id, p_sender_type, p_content, p_message_type, p_gift_id, p_gift_quantity);
end;
$$;

create or replace function public.chat_send_message(
  p_room_id uuid,
  p_content text,
  p_message_type text default 'text'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room record;
  v_sender_type text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select user_id
    into v_room
  from public.chat_rooms
  where id = p_room_id;

  if not found then
    raise exception 'Chat room not found';
  end if;

  if v_room.user_id = v_uid then
    v_sender_type := 'user';
  elsif private.agent_owns_chat_room(p_room_id) or private.is_admin() then
    v_sender_type := 'profile';
  else
    raise exception 'Forbidden';
  end if;

  return private.chat_send_message(p_room_id, v_sender_type, p_content, p_message_type, null, null);
end;
$$;

create or replace function private.chat_mark_read(p_room_id uuid, p_reader_type text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := (select auth.uid());
  v_reader text := lower(coalesce(p_reader_type, ''));
  v_room record;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select id, user_id, profile_id
    into v_room
  from public.chat_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Chat room not found';
  end if;

  if v_reader = 'user' then
    if v_room.user_id <> v_uid then
      raise exception 'Forbidden';
    end if;

    update public.messages
    set is_read = true,
        read_at = v_now
    where room_id = p_room_id
      and coalesce(is_read, false) = false
      and sender_type = 'profile';

    update public.chat_rooms
    set unread_count = 0
    where id = p_room_id;
  elsif v_reader = 'profile' then
    if not private.agent_owns_chat_room(p_room_id) and not private.is_admin() then
      raise exception 'Forbidden';
    end if;

    update public.messages
    set is_read = true,
        read_at = v_now
    where room_id = p_room_id
      and coalesce(is_read, false) = false
      and sender_type = 'user';

    update public.chat_rooms
    set profile_unread_count = 0
    where id = p_room_id;
  else
    raise exception 'Invalid reader_type';
  end if;
end;
$$;

create or replace function public.chat_mark_read(p_room_id uuid, p_reader_type text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform private.chat_mark_read(p_room_id, p_reader_type);
end;
$$;

create or replace function private.get_chat_room_user_profiles(user_ids uuid[])
returns table(
  id uuid,
  name varchar,
  nickname varchar,
  profile_image varchar,
  is_online boolean,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public
set row_security = off
as $$
  select up.id, up.name, up.nickname, up.profile_image, up.is_online, up.last_active_at
  from public.user_profiles up
  where up.id = any(user_ids)
    and (
      private.is_admin()
      or exists (
        select 1
        from public.chat_rooms cr
        join public.chat_profiles cp on cp.id = cr.profile_id
        where cr.user_id = up.id
          and cp.assigned_agent_id = (select auth.uid())
          and private.is_agent()
      )
    );
$$;

create or replace function public.get_chat_room_user_profiles(user_ids uuid[])
returns table(
  id uuid,
  name varchar,
  nickname varchar,
  profile_image varchar,
  is_online boolean,
  last_active_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select * from private.get_chat_room_user_profiles(user_ids);
$$;

create or replace function private.get_user_total_room_counts(user_ids uuid[])
returns table(user_id uuid, room_count bigint)
language sql
security definer
set search_path = public
set row_security = off
as $$
  select cr.user_id, count(*) as room_count
  from public.chat_rooms cr
  where cr.user_id = any(user_ids)
    and (
      private.is_admin()
      or exists (
        select 1
        from public.chat_rooms owned
        join public.chat_profiles cp on cp.id = owned.profile_id
        where owned.user_id = cr.user_id
          and cp.assigned_agent_id = (select auth.uid())
          and private.is_agent()
      )
    )
  group by cr.user_id;
$$;

create or replace function public.get_user_total_room_counts(user_ids uuid[])
returns table(user_id uuid, room_count bigint)
language sql
security invoker
set search_path = public
as $$
  select * from private.get_user_total_room_counts(user_ids);
$$;

create or replace function private.update_chat_room_gift_stats(
  p_room_id uuid,
  p_sender_type text,
  p_delta_count integer,
  p_delta_value bigint
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_sender_type text := lower(coalesce(p_sender_type, ''));
  v_delta_count integer := coalesce(p_delta_count, 0);
  v_delta_value bigint := coalesce(p_delta_value, 0);
  v_room record;
begin
  select user_id, profile_id
    into v_room
  from public.chat_rooms
  where id = p_room_id;

  if not found then
    raise exception 'Chat room not found';
  end if;

  if v_sender_type = 'user' then
    if v_room.user_id <> (select auth.uid()) and not private.is_service_role() then
      raise exception 'Forbidden';
    end if;

    update public.chat_rooms
    set user_gifts_count = greatest(coalesce(user_gifts_count, 0) + v_delta_count, 0),
        user_gifts_value = greatest(coalesce(user_gifts_value, 0) + v_delta_value, 0)
    where id = p_room_id;
  elsif v_sender_type = 'profile' then
    if not private.agent_owns_chat_room(p_room_id) and not private.is_admin() and not private.is_service_role() then
      raise exception 'Forbidden';
    end if;

    update public.chat_rooms
    set profile_gifts_count = greatest(coalesce(profile_gifts_count, 0) + v_delta_count, 0),
        profile_gifts_value = greatest(coalesce(profile_gifts_value, 0) + v_delta_value, 0)
    where id = p_room_id;
  else
    raise exception 'Invalid sender_type';
  end if;
end;
$$;

create or replace function public.update_chat_room_gift_stats(
  p_room_id uuid,
  p_sender_type text,
  p_delta_count integer,
  p_delta_value bigint
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform private.update_chat_room_gift_stats(p_room_id, p_sender_type, p_delta_count, p_delta_value);
end;
$$;

create or replace function private.update_chat_profile_gift_stats(
  p_room_id uuid,
  p_delta_count integer,
  p_delta_value integer
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_profile_id uuid;
begin
  select cr.profile_id
    into v_profile_id
  from public.chat_rooms cr
  where cr.id = p_room_id
    and (
      cr.user_id = (select auth.uid())
      or private.is_service_role()
    );

  if v_profile_id is null then
    raise exception 'Forbidden';
  end if;

  update public.chat_profiles cp
  set total_gifts_received = greatest(coalesce(cp.total_gifts_received, 0) + coalesce(p_delta_count, 0), 0),
      total_gift_value = greatest(coalesce(cp.total_gift_value, 0) + coalesce(p_delta_value, 0), 0)
  where cp.id = v_profile_id;
end;
$$;

create or replace function public.update_chat_profile_gift_stats(
  p_room_id uuid,
  p_delta_count integer,
  p_delta_value integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform private.update_chat_profile_gift_stats(p_room_id, p_delta_count, p_delta_value);
end;
$$;

create or replace function private.chat_send_gift_user(
  p_room_id uuid,
  p_gift_id uuid,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := (select auth.uid());
  v_qty integer := coalesce(p_quantity, 0);
  v_room record;
  v_gift record;
  v_profile record;
  v_points bigint;
  v_inv record;
  v_inv_after integer;
  v_tx_id uuid;
  v_msg_id uuid;
  v_agent_id uuid;
  v_now timestamptz := now();
  v_label text;
  v_last_msg text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_qty <= 0 then
    raise exception 'Invalid quantity';
  end if;

  select id, user_id, profile_id
    into v_room
  from public.chat_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Chat room not found';
  end if;

  if v_room.user_id <> v_uid then
    raise exception 'Forbidden';
  end if;

  select id, buy_price, name, emoji
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  select id, name, assigned_agent_id
    into v_profile
  from public.chat_profiles
  where id = v_room.profile_id;

  v_agent_id := v_profile.assigned_agent_id;
  v_points := coalesce(v_gift.buy_price, 0)::bigint * v_qty::bigint;

  select id, quantity
    into v_inv
  from public.gift_inventory
  where owner_id = v_uid
    and owner_type = 'user'
    and gift_id = p_gift_id
  for update;

  if not found or coalesce(v_inv.quantity, 0) < v_qty then
    raise exception 'Insufficient inventory';
  end if;

  v_inv_after := coalesce(v_inv.quantity, 0) - v_qty;

  update public.gift_inventory
  set quantity = v_inv_after
  where id = v_inv.id;

  delete from public.gift_inventory
  where id = v_inv.id
    and quantity <= 0;

  update public.user_profiles
  set gift_inventory_count = greatest(coalesce(gift_inventory_count, 0) - v_qty, 0),
      gift_inventory_value = greatest(coalesce(gift_inventory_value, 0) - v_points, 0),
      updated_at = now()
  where id = v_uid;

  if v_agent_id is not null then
    insert into public.gift_inventory(owner_id, owner_type, gift_id, quantity, acquired_at)
    values (v_agent_id, 'agent', p_gift_id, v_qty, v_now)
    on conflict (owner_id, gift_id, owner_type)
    do update set
      quantity = coalesce(public.gift_inventory.quantity, 0) + excluded.quantity,
      acquired_at = v_now;

    update public.agents
    set total_gift_revenue = coalesce(total_gift_revenue, 0) + v_points,
        total_revenue = coalesce(total_revenue, 0) + v_points,
        updated_at = now()
    where id = v_agent_id;
  end if;

  insert into public.gift_transactions(
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    room_id,
    points_amount,
    quantity,
    transaction_type,
    agent_id,
    agent_revenue
  ) values (
    p_gift_id,
    v_uid,
    'user',
    v_room.profile_id,
    'profile',
    p_room_id,
    v_points::integer,
    v_qty,
    'send',
    v_agent_id,
    v_points
  ) returning id into v_tx_id;

  v_label := trim(coalesce(v_gift.emoji, '🎁') || ' ' || coalesce(v_gift.name, ''));
  v_last_msg := '🎁 ' || coalesce(v_profile.name, '상대방') || '님에게 ' || coalesce(v_gift.name, '선물') || ' ' || v_qty || '개를 보냈습니다!';

  insert into public.messages(
    room_id,
    sender_id,
    sender_type,
    content,
    message,
    message_type,
    type,
    gift_id,
    gift_quantity,
    is_read,
    created_at
  ) values (
    p_room_id,
    v_uid,
    'user',
    v_label,
    v_label,
    'gift',
    'gift',
    p_gift_id,
    v_qty,
    false,
    v_now
  ) returning id into v_msg_id;

  update public.chat_rooms
  set last_message = v_last_msg,
      last_message_at = v_now,
      last_message_sender_type = 'user',
      profile_unread_count = coalesce(profile_unread_count, 0) + 1,
      user_gifts_count = coalesce(user_gifts_count, 0) + v_qty,
      user_gifts_value = coalesce(user_gifts_value, 0) + v_points
  where id = p_room_id;

  update public.chat_profiles
  set total_gifts_received = coalesce(total_gifts_received, 0) + v_qty,
      total_gift_value = coalesce(total_gift_value, 0) + v_points
  where id = v_room.profile_id;

  return jsonb_build_object('gift_transaction_id', v_tx_id, 'message_id', v_msg_id);
end;
$$;

create or replace function public.chat_send_gift_user(
  p_room_id uuid,
  p_gift_id uuid,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.chat_send_gift_user(p_room_id, p_gift_id, p_quantity);
end;
$$;

create or replace function private.chat_send_gift_profile(
  p_room_id uuid,
  p_gift_id uuid,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := (select auth.uid());
  v_qty integer := coalesce(p_quantity, 0);
  v_room record;
  v_gift record;
  v_user record;
  v_points bigint;
  v_tx_id uuid;
  v_msg_id uuid;
  v_agent_id uuid;
  v_now timestamptz := now();
  v_label text;
  v_current_qty integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_qty <= 0 then
    raise exception 'Invalid quantity';
  end if;

  if not private.agent_owns_chat_room(p_room_id) and not private.is_admin() then
    raise exception 'Forbidden';
  end if;

  select id, user_id, profile_id
    into v_room
  from public.chat_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Chat room not found';
  end if;

  select id, buy_price, name, emoji
    into v_gift
  from public.gifts
  where id = p_gift_id;

  if not found then
    raise exception 'Gift not found';
  end if;

  select id, name, nickname
    into v_user
  from public.user_profiles
  where id = v_room.user_id;

  select cp.assigned_agent_id
    into v_agent_id
  from public.chat_profiles cp
  where cp.id = v_room.profile_id;

  if v_agent_id is null then
    raise exception 'Assigned agent not found';
  end if;

  v_points := coalesce(v_gift.buy_price, 0)::bigint * v_qty::bigint;

  select quantity
    into v_current_qty
  from public.gift_inventory
  where owner_id = v_agent_id
    and owner_type = 'agent'
    and gift_id = p_gift_id
  for update;

  if v_current_qty is null or v_current_qty < v_qty then
    raise exception 'Insufficient inventory';
  end if;

  update public.gift_inventory
  set quantity = quantity - v_qty
  where owner_id = v_agent_id
    and owner_type = 'agent'
    and gift_id = p_gift_id;

  delete from public.gift_inventory
  where owner_id = v_agent_id
    and owner_type = 'agent'
    and gift_id = p_gift_id
    and quantity <= 0;

  insert into public.gift_inventory(owner_id, owner_type, gift_id, quantity, acquired_at)
  values (v_room.user_id, 'user', p_gift_id, v_qty, v_now)
  on conflict (owner_id, gift_id, owner_type)
  do update set
    quantity = coalesce(public.gift_inventory.quantity, 0) + excluded.quantity,
    acquired_at = v_now;

  update public.user_profiles
  set gift_inventory_count = coalesce(gift_inventory_count, 0) + v_qty,
      gift_inventory_value = coalesce(gift_inventory_value, 0) + v_points,
      updated_at = now()
  where id = v_room.user_id;

  insert into public.gift_transactions(
    gift_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    room_id,
    points_amount,
    quantity,
    transaction_type,
    agent_id,
    agent_revenue
  ) values (
    p_gift_id,
    v_room.profile_id,
    'profile',
    v_room.user_id,
    'user',
    p_room_id,
    v_points::integer,
    v_qty,
    'send',
    v_agent_id,
    0
  ) returning id into v_tx_id;

  v_label := '🎁' || coalesce(v_gift.emoji, '') || ' ' || coalesce(v_user.nickname, v_user.name, '회원') || '님에게 ' || coalesce(v_gift.name, '선물') || ' ' || v_qty || '개를 보냈습니다!';

  insert into public.messages(
    room_id,
    sender_id,
    sender_type,
    content,
    message,
    message_type,
    type,
    gift_id,
    gift_quantity,
    is_read,
    created_at
  ) values (
    p_room_id,
    v_room.profile_id,
    'profile',
    v_label,
    v_label,
    'gift',
    'gift',
    p_gift_id,
    v_qty,
    false,
    v_now
  ) returning id into v_msg_id;

  update public.chat_rooms
  set last_message = v_label,
      last_message_at = v_now,
      last_message_sender_type = 'profile',
      unread_count = coalesce(unread_count, 0) + 1,
      profile_gifts_count = coalesce(profile_gifts_count, 0) + v_qty,
      profile_gifts_value = coalesce(profile_gifts_value, 0) + v_points
  where id = p_room_id;

  return jsonb_build_object('gift_transaction_id', v_tx_id, 'message_id', v_msg_id);
end;
$$;

create or replace function public.chat_send_gift_profile(
  p_room_id uuid,
  p_gift_id uuid,
  p_quantity integer default 1
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  return private.chat_send_gift_profile(p_room_id, p_gift_id, p_quantity);
end;
$$;

revoke execute on function private.agent_owns_chat_profile(uuid) from public, anon;
revoke execute on function private.agent_owns_chat_room(uuid) from public, anon;
revoke execute on function private.check_chat_profile_agent_update_allowed(
  uuid,
  text,
  integer,
  text,
  jsonb,
  text,
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  bigint,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz
) from public, anon;
revoke execute on function private.recalc_chat_profile_counters(uuid) from public, anon;
revoke execute on function private.chat_profiles_enforce_active_online() from public, anon;
revoke execute on function private.chat_rooms_after_change_update_profile_counters() from public, anon;
revoke execute on function private.messages_after_change_update_profile_counters() from public, anon;
revoke execute on function private.chat_room_history_on_insert() from public, anon;
revoke execute on function private.create_or_get_chat_room(uuid) from public, anon;
revoke execute on function private.chat_send_message(uuid, text, text, text, uuid, integer) from public, anon;
revoke execute on function private.chat_mark_read(uuid, text) from public, anon;
revoke execute on function private.get_chat_room_user_profiles(uuid[]) from public, anon;
revoke execute on function private.get_user_total_room_counts(uuid[]) from public, anon;
revoke execute on function private.update_chat_room_gift_stats(uuid, text, integer, bigint) from public, anon, authenticated;
revoke execute on function private.update_chat_profile_gift_stats(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function private.chat_send_gift_user(uuid, uuid, integer) from public, anon;
revoke execute on function private.chat_send_gift_profile(uuid, uuid, integer) from public, anon;

revoke execute on function public.create_or_get_chat_room(uuid) from public, anon;
revoke execute on function public.chat_send_message(uuid, text, text, text, uuid, integer) from public, anon;
revoke execute on function public.chat_send_message(uuid, text, text) from public, anon;
revoke execute on function public.chat_mark_read(uuid, text) from public, anon;
revoke execute on function public.get_chat_room_user_profiles(uuid[]) from public, anon;
revoke execute on function public.get_user_total_room_counts(uuid[]) from public, anon;
revoke execute on function public.update_chat_room_gift_stats(uuid, text, integer, bigint) from public, anon, authenticated;
revoke execute on function public.update_chat_profile_gift_stats(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.chat_send_gift_user(uuid, uuid, integer) from public, anon;
revoke execute on function public.chat_send_gift_profile(uuid, uuid, integer) from public, anon;

grant execute on function public.create_or_get_chat_room(uuid) to authenticated;
grant execute on function public.chat_send_message(uuid, text, text, text, uuid, integer) to authenticated;
grant execute on function public.chat_send_message(uuid, text, text) to authenticated;
grant execute on function public.chat_mark_read(uuid, text) to authenticated;
grant execute on function public.get_chat_room_user_profiles(uuid[]) to authenticated;
grant execute on function public.get_user_total_room_counts(uuid[]) to authenticated;
grant execute on function public.update_chat_room_gift_stats(uuid, text, integer, bigint) to service_role;
grant execute on function public.update_chat_profile_gift_stats(uuid, integer, integer) to service_role;
grant execute on function public.chat_send_gift_user(uuid, uuid, integer) to authenticated;
grant execute on function public.chat_send_gift_profile(uuid, uuid, integer) to authenticated;

grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function private.is_agent() to anon, authenticated;
grant execute on function private.is_service_role() to authenticated, service_role;
grant execute on function private.agent_owns_chat_profile(uuid) to anon, authenticated, service_role;
grant execute on function private.agent_owns_chat_room(uuid) to anon, authenticated, service_role;
grant execute on function private.check_chat_profile_agent_update_allowed(
  uuid,
  text,
  integer,
  text,
  jsonb,
  text,
  uuid,
  uuid,
  uuid,
  boolean,
  boolean,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  bigint,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz
) to authenticated, service_role;
grant execute on function private.create_or_get_chat_room(uuid) to authenticated, service_role;
grant execute on function private.chat_send_message(uuid, text, text, text, uuid, integer) to authenticated, service_role;
grant execute on function private.chat_mark_read(uuid, text) to authenticated, service_role;
grant execute on function private.get_chat_room_user_profiles(uuid[]) to authenticated, service_role;
grant execute on function private.get_user_total_room_counts(uuid[]) to authenticated, service_role;
grant execute on function private.update_chat_room_gift_stats(uuid, text, integer, bigint) to service_role;
grant execute on function private.update_chat_profile_gift_stats(uuid, integer, integer) to service_role;
grant execute on function private.chat_send_gift_user(uuid, uuid, integer) to authenticated, service_role;
grant execute on function private.chat_send_gift_profile(uuid, uuid, integer) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_profiles;
    alter publication supabase_realtime add table public.chat_rooms;
    alter publication supabase_realtime add table public.messages;
  end if;
exception
  when duplicate_object then
    null;
end $$;
