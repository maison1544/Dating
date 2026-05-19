create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title varchar not null,
  content text not null,
  category varchar default 'general'::varchar,
  is_pinned boolean default false,
  is_published boolean default true,
  author_id uuid references public.admins(id) on delete set null,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notices_author_id on public.notices(author_id);
create index if not exists idx_notices_pinned on public.notices(is_pinned, created_at desc);
create index if not exists idx_notices_published on public.notices(is_published, created_at desc);

alter table public.notices enable row level security;

drop policy if exists "Admins can manage notices" on public.notices;
drop policy if exists "Anyone can view published notices" on public.notices;
drop policy if exists notices_manage_admins on public.notices;
drop policy if exists notices_select_published on public.notices;

create policy notices_manage_admins
on public.notices
for all
to public
using (private.is_admin())
with check (private.is_admin());

create policy notices_select_published
on public.notices
for select
to public
using (coalesce(is_published, true) = true or private.is_admin());

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

do $$
begin
  alter publication supabase_realtime add table public.notices;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create or replace function public.increment_notice_view(p_notice_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views integer;
begin
  update public.notices
  set view_count = coalesce(view_count, 0) + 1,
      updated_at = now()
  where id = p_notice_id
    and coalesce(is_published, true) = true
  returning view_count into v_new_views;

  return coalesce(v_new_views, 0);
end;
$$;

revoke execute on function public.increment_notice_view(uuid) from public;
grant execute on function public.increment_notice_view(uuid) to anon, authenticated;
