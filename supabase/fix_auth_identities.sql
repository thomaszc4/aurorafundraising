-- ==========================================
-- FINAL FIX: AUTH IDENTITIES (The Missing Link)
-- ==========================================
-- The 500 Error happens because we inserted a User manually
-- but didn't give them an Identity. Supabase crashes trying to find it.

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_encrypted_pw text;
BEGIN
  -- 1. CLEANUP (Remove the "broken" user if exists)
  DELETE FROM auth.identities WHERE email = 'admin@test.com'; -- Cleanup old identities
  DELETE FROM auth.users WHERE email = 'admin@test.com';      -- Cleanup user (cascades usually, but being safe)

  -- 2. GENERATE HASH
  -- We use pgcrypto to make a valid password hash
  v_encrypted_pw := crypt('Test1234!', gen_salt('bf'));

  -- 3. INSERT USER
  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    is_super_admin
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin1"}',
    now(),
    now(),
    '',
    false
  );

  -- 4. INSERT IDENTITY (CRITICAL STEP MISSING BEFORE)
  -- This tells Supabase "Yes, this email provider entry is valid"
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,                    -- Same UUID as user
    v_user_id,                    -- Link to user
    'admin@test.com',             -- provider_id (usually email for email provider)
    jsonb_build_object('sub', v_user_id, 'email', 'admin@test.com'),
    'email',                      -- provider type
    now(),
    now(),
    now()
  );

  -- 5. SETUP PROFILE (Standard)
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (v_user_id, 'admin@test.com', 'Admin1', now(), now())
  ON CONFLICT (id) DO UPDATE SET full_name = 'Admin1';

  -- 6. SETUP ROLE (Standard)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;

END $$;
