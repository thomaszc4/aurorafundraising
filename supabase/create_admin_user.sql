-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- 1. Insert the user into auth.users (if not exists)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@test.com';

  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      is_super_admin
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('Test1234!', gen_salt('bf')), -- Hash the password
      now(), -- Auto confirm email
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin1"}',
      now(),
      now(),
      '',
      '',
      false
    );
  END IF;

  -- 2. Create Profile (Trigger usually handles this, but safe to ensure)
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (new_user_id, 'admin@test.com', 'Admin1', now(), now())
  ON CONFLICT (id) DO UPDATE SET full_name = 'Admin1';

  -- 3. Assign Admin Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (id) DO NOTHING;
  
  -- Also ensure no conflicting roles if logic requires single role
  -- (Assuming user_roles allows multiple or we just want admin)

END $$;
