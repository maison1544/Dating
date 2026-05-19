insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('chat-profile-images', 'chat-profile-images', true, 10485760, array['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']),
  ('chat-images', 'chat-images', true, 10485760, array['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

drop policy if exists public_read_profile_and_chat_images on storage.objects;
drop policy if exists authenticated_manage_own_profile_and_chat_images on storage.objects;
drop policy if exists "Anyone can view chat images" on storage.objects;
drop policy if exists "Allow authenticated users to upload chat images" on storage.objects;
drop policy if exists "Allow authenticated users to delete chat images" on storage.objects;

create policy public_read_profile_and_chat_images
on storage.objects
for select
to public
using (bucket_id in ('profile-images', 'chat-profile-images', 'chat-images'));

create policy authenticated_insert_profile_and_chat_images
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('profile-images', 'chat-profile-images', 'chat-images')
  and (
    owner = auth.uid()
    or owner_id = auth.uid()::text
    or (storage.foldername(name))[1] = auth.uid()::text
    or bucket_id in ('chat-profile-images', 'chat-images')
  )
);

create policy authenticated_update_own_profile_and_chat_images
on storage.objects
for update
to authenticated
using (
  bucket_id in ('profile-images', 'chat-profile-images', 'chat-images')
  and (
    owner = auth.uid()
    or owner_id = auth.uid()::text
    or (storage.foldername(name))[1] = auth.uid()::text
    or bucket_id in ('chat-profile-images', 'chat-images')
  )
)
with check (
  bucket_id in ('profile-images', 'chat-profile-images', 'chat-images')
  and (
    owner = auth.uid()
    or owner_id = auth.uid()::text
    or (storage.foldername(name))[1] = auth.uid()::text
    or bucket_id in ('chat-profile-images', 'chat-images')
  )
);

create policy authenticated_delete_own_profile_and_chat_images
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('profile-images', 'chat-profile-images', 'chat-images')
  and (
    owner = auth.uid()
    or owner_id = auth.uid()::text
    or (storage.foldername(name))[1] = auth.uid()::text
    or bucket_id in ('chat-profile-images', 'chat-images')
  )
);
