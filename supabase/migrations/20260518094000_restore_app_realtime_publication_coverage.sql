do $$
declare
  v_table text;
  v_tables text[] := array[
    'admin_action_logs',
    'admins',
    'agents',
    'charging_cards',
    'chat_profiles',
    'chat_rooms',
    'deposit_requests',
    'game_bets',
    'game_chats',
    'game_rounds',
    'game_settings',
    'gift_inventory',
    'gift_transactions',
    'gifts',
    'messages',
    'point_transactions',
    'user_profiles',
    'withdrawal_requests'
  ];
begin
  foreach v_table in array v_tables loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end;
$$;
