-- ==========================================
-- ULTIMATE AUTH RESET & REBUILD
-- ==========================================

-- 1. Ensure Enum has 'individual'
-- Usage of ALTER TYPE in a transaction can be tricky, so we do it defensively.
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'individual';
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if already exists
END $$;

-- 2. Drop Existing Triggers to "Gut" the old logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create a ROBUST handle_new_user function
-- This function uses a "Safe Block" approach. If profile/role creation fails, 
-- it catches the error so the main User Creation does not fail.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role_str text;
  v_role public.app_role;
BEGIN
  -- A. Create Profile
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
  EXCEPTION WHEN OTHERS THEN
    -- Log error if we had a logs table, otherwise ignore to allow signup
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;

  -- B. Determine Role
  v_role_str := NEW.raw_user_meta_data->>'role';
  
  -- Strict matching to Enum
  IF v_role_str = 'individual' THEN
    v_role := 'individual';
  ELSIF v_role_str = 'organization_admin' THEN
    v_role := 'organization_admin';
  ELSIF v_role_str = 'student' THEN
    v_role := 'student';
  ELSE
    -- Default to organization_admin if unknown, or maybe we should default to 'individual'?
    -- Let's default to organization_admin for legacy compatibility, or handle null.
    v_role := 'organization_admin';
  END IF;

  -- C. Assign Role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Role assignment failed for user %: %', NEW.id, SQLERRM;
  END;

  -- D. Handle Organization Details (if applicable)
  -- If org_name is present, we might want to create an organization record?
  -- For now, we store it in metadata or profiles. 
  -- Example: If we had an 'organizations' table, we would insert here.

  RETURN NEW;
END;
$$;

-- 4. Re-attach the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure RLS Policies are not blocking Insert (Double Check)
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
CREATE POLICY "Roles are viewable by everyone" 
  ON public.user_roles FOR SELECT 
  USING (true);

-- (Triggers bypass RLS with SECURITY DEFINER, so Insert policy isn't strictly needed for the trigger, 
-- but good for client-side if used)

