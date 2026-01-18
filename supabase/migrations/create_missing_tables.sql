-- Create missing tables
-- Run in Supabase Dashboard > SQL Editor

-- 1. chat_profiles table
CREATE TABLE IF NOT EXISTS public.chat_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  bio TEXT,
  job TEXT,
  height INTEGER,
  weight INTEGER,
  image TEXT,
  image_object_id UUID REFERENCES storage.objects(id) ON DELETE SET NULL,
  interests JSONB,
  chat_cost INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  assigned_agent_id UUID REFERENCES public.agents(id),
  active_chats INTEGER DEFAULT 0,
  total_chats INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_gift_value BIGINT DEFAULT 0,
  chat_request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. charging_cards table
CREATE TABLE IF NOT EXISTS public.charging_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  bonus_amount INTEGER DEFAULT 0,
  total_amount INTEGER GENERATED ALWAYS AS (amount + COALESCE(bonus_amount, 0)) STORED,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.admins(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. gifts table
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  buy_price INTEGER NOT NULL,
  sell_price INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for development
ALTER TABLE public.chat_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts DISABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO public.charging_cards (name, amount, bonus_amount, display_order, is_active, created_by)
SELECT v.name, v.amount, v.bonus_amount, v.display_order, v.is_active, a.id
FROM (
  VALUES
    ('Starter', 10000, 0, 1, true),
    ('Basic', 30000, 3000, 2, true),
    ('Standard', 50000, 7000, 3, true),
    ('Premium', 100000, 20000, 4, true),
    ('VIP', 300000, 80000, 5, true)
) AS v(name, amount, bonus_amount, display_order, is_active)
CROSS JOIN LATERAL (
  SELECT id
  FROM public.admins
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1
) a
ON CONFLICT DO NOTHING;

INSERT INTO public.gifts (name, description, emoji, buy_price, sell_price, display_order, is_active) VALUES
  ('Rose', 'A beautiful rose', 'rose', 100, 80, 1, true),
  ('Heart', 'Love heart', 'heart', 50, 40, 2, true),
  ('Diamond', 'Precious diamond', 'gem', 500, 400, 3, true),
  ('Cake', 'Sweet cake', 'cake', 200, 160, 4, true),
  ('Champagne', 'Celebration drink', 'champagne', 300, 240, 5, true),
  ('Star', 'Shining star', 'star', 150, 120, 6, true),
  ('Gift Box', 'Surprise gift', 'gift', 250, 200, 7, true),
  ('Crown', 'Royal crown', 'crown', 1000, 800, 8, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_profiles (name, age, bio, job, is_active, is_online) VALUES
  ('Jimin', 25, 'Bright and active personality', 'Designer', true, true),
  ('Seoyeon', 23, 'Love reading books', 'Writer', true, true),
  ('Minjun', 28, 'Love sports', 'Trainer', true, false),
  ('Subin', 26, 'Love cooking', 'Chef', true, true),
  ('Hayun', 24, 'Love music', 'Musician', true, false)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public.chat_profiles TO anon, authenticated;
GRANT ALL ON public.charging_cards TO anon, authenticated;
GRANT ALL ON public.gifts TO anon, authenticated;
