do $$
declare
  v_admin uuid;
begin
  select id into v_admin
  from public.admins
  where role = 'super_admin'
  order by created_at asc nulls last
  limit 1;

  if v_admin is null then
    select id into v_admin
    from public.admins
    order by created_at asc nulls last
    limit 1;
  end if;

  if v_admin is not null then
    update public.charging_cards
    set created_by = v_admin
    where created_by is null;
  end if;
end $$;

create or replace function public.set_charging_cards_created_by()
returns trigger
language plpgsql
as $$
declare
  v_admin uuid;
begin
  if new.created_by is null then
    new.created_by := auth.uid();

    if new.created_by is null then
      select id into v_admin
      from public.admins
      order by created_at asc nulls last
      limit 1;

      new.created_by := v_admin;
    end if;
  end if;

  return new;
end;
$$;

alter table public.charging_cards
  alter column created_by set not null;

alter table public.charging_cards drop constraint if exists charging_cards_created_by_fkey;

alter table public.charging_cards
  add constraint charging_cards_created_by_fkey
  foreign key (created_by)
  references public.admins(id)
  on delete restrict;
