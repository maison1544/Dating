create or replace function private.normalize_game_loss_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'lose' and new.related_type = 'game_bets' then
    new.amount := 0;
    new.balance_after := new.balance_before;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_game_loss_transaction on public.point_transactions;
create trigger normalize_game_loss_transaction
before insert or update on public.point_transactions
for each row execute function private.normalize_game_loss_transaction();

update public.point_transactions
set amount = 0,
    balance_after = balance_before
where type = 'lose'
  and amount <> 0
  and related_type = 'game_bets';

drop policy if exists withdrawal_requests_insert_own_pending on public.withdrawal_requests;
create policy withdrawal_requests_insert_own_pending
on public.withdrawal_requests
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and processed_by is null
  and processed_at is null
);

drop policy if exists deposit_requests_insert_own_pending on public.deposit_requests;
create policy deposit_requests_insert_own_pending
on public.deposit_requests
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and processed_by is null
  and processed_at is null
);
