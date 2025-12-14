-- ==========================================
-- NUCLEAR CONSISTENCY FIX
-- ==========================================

-- 1. RELOAD SCHEMA CACHE (Fixes "Database error querying schema" if cache is stale)
NOTIFY pgrst, 'reload config';

-- 2. RESET PERMISSIONS (Fixes "Permission denied")
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. NUKE & REBUILD POLICIES (Fixes Conflicts)
-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles; -- Old name
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;       -- New name
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
-- Recreate Single Simple Policy
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
-- Admin override
CREATE POLICY "Admins full access to roles" ON public.user_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate Simple Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin override
CREATE POLICY "Admins full access to profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
);

-- 4. FORCE REFRESH ADMIN USER (Just in case)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT DO NOTHING;
