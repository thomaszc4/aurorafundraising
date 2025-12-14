-- ==========================================
-- MASTER AUTH FIX SCRIPT
-- ==========================================

-- 1. FIX THE TRIGGER FUNCTION
-- Ensure proper handling of metadata and conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- 2. ENSURE THE TRIGGER EXISTS
-- (This was likely missing or broken)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. FIX RLS POLICIES
-- Ensure users can read their own data so the UI doesn't crash on login
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to read their own roles (CRITICAL for login redirect)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 4. FORCE CREATE ADMIN USER (Idempotent)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check for existing user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@test.com';
  
  -- Create if not exists
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, role, aud, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin1"}', now(), now()
    );
  END IF;

  -- Profile should be created by trigger, but ensure it exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, 'admin@test.com', 'Admin1')
  ON CONFLICT (id) DO NOTHING;

  -- Assign Admin Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;
  
END $$;
