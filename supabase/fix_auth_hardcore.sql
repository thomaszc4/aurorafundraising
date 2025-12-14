-- ==========================================
-- HARDCORE AUTH & PERMISSIONS FIX
-- ==========================================

-- 1. SYNC ENUMS (Fix potential type errors)
-- Add missing roles to the ENUM if they don't exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'campaign_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'participant';
-- (Existing: admin, student, organization_admin)

-- 2. RESET TRIGGERS ON AUTH.USERS (Fix broken login triggers)
-- First, drop specific known triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users; -- Common variant
DROP TRIGGER IF EXISTS update_user_status ON auth.users; -- Hypothetical bad trigger

-- 3. RECREATE USER CREATION TRIGGER (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create Profile
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ENSURE UTILITY FUNCTIONS (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5. RESET RLS WITH NO RECURSION
-- Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access to profiles" ON public.profiles FOR ALL USING (
  public.has_role(auth.uid(), 'admin'::app_role) -- Uses SECURITY DEFINER function! No recursion.
);

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins full access to roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access to roles" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'admin'::app_role) -- Uses SECURITY DEFINER function! No recursion.
);

-- 6. RELOAD CACHE
NOTIFY pgrst, 'reload config';

-- 7. RE-SEED ADMIN (Just in case)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT DO NOTHING;
