insert into public.system_settings (key, value, description)
values
  ('session_timeout_minutes', '120', 'Default local session timeout in minutes'),
  ('app_name', 'DatingDesignPrototype', 'Application display name')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

insert into public.game_settings (game_type, is_active, min_bet, max_bet, round_duration_seconds, betting_end_seconds, odds, updated_at)
values
  ('powerball', true, 1000, 1000000, 180, 30, '{"enabled":{"normal-odd":true,"normal-even":true,"normal-under":true,"normal-over":true,"powerball-odd":true,"powerball-even":true,"powerball-under":true,"powerball-over":true},"odds":{"normal-odd":1.95,"normal-even":1.95,"normal-under":1.95,"normal-over":1.95,"powerball-odd":1.95,"powerball-even":1.95,"powerball-under":1.95,"powerball-over":1.95}}'::jsonb, now()),
  ('ladder', true, 1000, 1000000, 180, 30, '{"enabled":{"leftStart":true,"rightStart":true,"line3":true,"line4":true,"oddEnd":true,"evenEnd":true,"left3Even":true,"left4Odd":true,"right3Odd":true,"right4Even":true},"odds":{"leftStart":1.95,"rightStart":1.95,"line3":1.95,"line4":1.95,"oddEnd":1.95,"evenEnd":1.95,"left3Even":3.8,"left4Odd":3.8,"right3Odd":3.8,"right4Even":3.8}}'::jsonb, now())
on conflict (game_type) do update set
  is_active = excluded.is_active,
  min_bet = excluded.min_bet,
  max_bet = excluded.max_bet,
  round_duration_seconds = excluded.round_duration_seconds,
  betting_end_seconds = excluded.betting_end_seconds,
  odds = excluded.odds,
  updated_at = now();

insert into public.gifts (name, description, emoji, buy_price, sell_price, is_active, display_order, created_at, updated_at)
values
  ('장미', '테스트용 기본 선물', '🌹', 1000, 500, true, 1, now(), now()),
  ('하트', '테스트용 기본 선물', '💖', 3000, 1500, true, 2, now(), now())
on conflict do nothing;
