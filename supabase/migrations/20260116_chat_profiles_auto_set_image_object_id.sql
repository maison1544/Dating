create or replace function public.chat_profiles_set_image_object_id()
returns trigger
language plpgsql
security definer
set search_path to 'public'
set row_security to 'off'
as $$
declare
  v_bucket text := 'chat-profile-images';
  v_obj uuid;
  v_img text;
begin
  v_img := coalesce(new.image, '');

  if btrim(v_img) = '' then
    new.image_object_id := null;
    return new;
  end if;

  if v_img ~* '^(https?://|data:|blob:)' then
    new.image_object_id := null;
    return new;
  end if;

  select o.id
    into v_obj
  from storage.objects o
  where o.bucket_id = v_bucket
    and o.name = v_img
  order by o.created_at desc nulls last
  limit 1;

  if v_obj is not null then
    new.image_object_id := v_obj;
  end if;

  return new;
end;
$$;

drop trigger if exists chat_profiles_set_image_object_id on public.chat_profiles;
create trigger chat_profiles_set_image_object_id
before insert or update of image on public.chat_profiles
for each row
execute function public.chat_profiles_set_image_object_id();

do $$
begin
  update public.chat_profiles cp
  set image_object_id = o.id
  from storage.objects o
  where cp.image_object_id is null
    and cp.image is not null
    and btrim(cp.image) <> ''
    and cp.image !~* '^(https?://|data:|blob:)'
    and o.bucket_id = 'chat-profile-images'
    and o.name = cp.image;
end $$;
