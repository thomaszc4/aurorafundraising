-- ==========================================
-- FINAL RESET: ISOLATION MODE
-- ==========================================

-- 1. CLEAN UP (Delete potentially corrupted user)
DELETE FROM auth.identities WHERE email = 'admin@test.com'; -- If applicable in some versions
DELETE FROM auth.users WHERE email = 'admin@test.com';

-- 2. DISABLE RLS (Rule out Policy Recursion)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. REMOVE TRIGGERS (Rule out Function Errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. CLEAN INSERT (Manual, simple)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin1"}',
    now(),
    now()
);

-- 5. MANUAL PROFILE SYNC (Since trigger is off)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, 'Admin1', now(), now()
FROM auth.users WHERE email = 'admin@test.com';

-- 6. MANUAL ROLE ASSIGNMENT
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users WHERE email = 'admin@test.com';
