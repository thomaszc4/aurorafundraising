-- 1. Create the user safely (only if email doesn't exist)
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
    updated_at,
    confirmation_token
) 
SELECT 
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
    now(),
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@test.com'
);

-- 2. Create the profile (if not exists)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    'Admin1', 
    now(), 
    now()
FROM auth.users 
WHERE email = 'admin@test.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.users.id
);

-- 3. Assign the Admin Role (if not already assigned)
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id, 
    'admin'::app_role
FROM auth.users 
WHERE email = 'admin@test.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.users.id AND role = 'admin'::app_role
);
