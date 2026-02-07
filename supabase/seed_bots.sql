-- 1. Add is_bot column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_bot') THEN
        ALTER TABLE public.users ADD COLUMN is_bot boolean DEFAULT false;
    END IF;
END $$;

-- 2. Seed 15 Fake Female Users (Bots)
-- They are set to 'matching' status so they can be found by male users
INSERT INTO public.users (name, age, gender, target_gender, instagram_id, status, is_bot)
VALUES 
    ('Sarah', 23, 'female', 'male', '@sarah_xo', 'matching', true),
    ('Jessica', 25, 'female', 'male', '@jess_vibes', 'matching', true),
    ('Emily', 22, 'female', 'male', '@emily_rose', 'matching', true),
    ('Sophie', 24, 'female', 'male', '@sophie_luv', 'matching', true),
    ('Olivia', 26, 'female', 'male', '@liv_laugh', 'matching', true),
    ('Chloe', 21, 'female', 'male', '@chloee_xx', 'matching', true),
    ('Mia', 23, 'female', 'male', '@mia_catlover', 'matching', true),
    ('Isabella', 24, 'female', 'male', '@bella_dance', 'matching', true),
    ('Ava', 22, 'female', 'male', '@ava_sunshine', 'matching', true),
    ('Lily', 25, 'female', 'male', '@lily_flower', 'matching', true),
    ('Grace', 23, 'female', 'male', '@grace_sing', 'matching', true),
    ('Zoe', 21, 'female', 'male', '@zoe_travels', 'matching', true),
    ('Hannah', 24, 'female', 'male', '@hannah_b', 'matching', true),
    ('Emma', 22, 'female', 'male', '@emma_coffee', 'matching', true),
    ('Ruby', 25, 'female', 'male', '@ruby_red', 'matching', true);
