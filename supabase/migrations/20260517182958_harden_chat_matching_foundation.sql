drop policy if exists "chat_profiles_update_admins" on public.chat_profiles;
drop policy if exists "chat_profiles_update_assigned_agents" on public.chat_profiles;

create policy "chat_profiles_update_authenticated" on public.chat_profiles
for update to authenticated
using (
  private.is_admin()
  or private.agent_owns_chat_profile(id)
)
with check (
  private.is_admin()
  or private.check_chat_profile_agent_update_allowed(
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
