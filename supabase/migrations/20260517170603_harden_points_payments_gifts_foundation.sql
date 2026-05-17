revoke execute on all functions in schema private from public;
revoke execute on all functions in schema private from anon;
alter default privileges in schema private revoke execute on functions from public;

revoke execute on function public.add_points(uuid, integer, varchar, uuid, text) from public, anon;
revoke execute on function public.request_withdrawal_v2(uuid, integer, text, text, text) from public, anon;
revoke execute on function public.gift_buy(uuid, integer) from public, anon;
revoke execute on function public.gift_sell(uuid, integer) from public, anon;
revoke execute on function public.admin_gift_grant(uuid, uuid, integer, text, uuid) from public, anon;
revoke execute on function public.admin_gift_revoke(uuid, uuid, integer, text, uuid) from public, anon;
revoke execute on function public.admin_reclaim_gift_inventory(uuid) from public, anon;

grant execute on function public.add_points(uuid, integer, varchar, uuid, text) to authenticated, service_role;
grant execute on function public.request_withdrawal_v2(uuid, integer, text, text, text) to authenticated, service_role;
grant execute on function public.gift_buy(uuid, integer) to authenticated;
grant execute on function public.gift_sell(uuid, integer) to authenticated;
grant execute on function public.admin_gift_grant(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function public.admin_gift_revoke(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function public.admin_reclaim_gift_inventory(uuid) to authenticated;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function private.is_agent() to anon, authenticated;
grant execute on function private.check_user_profile_self_update_allowed(
  uuid,
  text,
  text,
  text,
  text,
  bigint,
  bigint,
  bigint,
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  text,
  uuid,
  integer,
  bigint,
  timestamptz,
  timestamptz
) to anon, authenticated;
grant execute on function private.is_service_role() to authenticated, service_role;
grant execute on function private.add_points(uuid, bigint, varchar, uuid, text, uuid, varchar) to authenticated, service_role;
grant execute on function private.request_withdrawal_v2(uuid, bigint, text, text, text) to authenticated, service_role;
grant execute on function private.gift_buy(uuid, integer) to authenticated;
grant execute on function private.gift_sell(uuid, integer) to authenticated;
grant execute on function private.admin_gift_grant(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function private.admin_gift_revoke(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function private.admin_reclaim_gift_inventory(uuid) to authenticated;

create index idx_charging_cards_created_by on public.charging_cards(created_by);
create index idx_deposit_requests_processed_by on public.deposit_requests(processed_by);
create index idx_gift_inventory_gift_id on public.gift_inventory(gift_id);
create index idx_gift_transactions_admin_id on public.gift_transactions(admin_id);
create index idx_gift_transactions_gift_id on public.gift_transactions(gift_id);
create index idx_point_transactions_admin_id on public.point_transactions(admin_id);
create index idx_withdrawal_requests_processed_by on public.withdrawal_requests(processed_by);
