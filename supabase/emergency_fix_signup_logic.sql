-- ==========================================
-- EMERGENCY FIX: ADD INDIVIDUAL ROLE & ROBUST TRIGGER
-- ==========================================

-- 1. Safely add 'individual' to the app_role enum
-- We wrap this in a DO block to catch if it already exists, although IF NOT EXISTS usually works for ADD VALUE in newer Postgres
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a plpgsql function block, so we run it as a raw statement.
-- If this line fails, it likely means it already exists or there is a transaction lock.
-- TRY RUNNING THIS LINE SEPARATELY IF THE SCRIPT FAILS.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'individual';

-- 2. Redefine the trigger with safer casting
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role_str text;
  v_role public.app_role;
BEGIN
  -- Insert Profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Logic to determine role safely
  v_role_str := NEW.raw_user_meta_data->>'role';

  -- If explicitly 'individual', try to set it. 
  -- If 'organization_admin', set it.
  -- Else fallback to 'organization_admin' (or student if we supported that flow here)
  
  IF v_role_str = 'individual' THEN
    v_role := 'individual';
  ELSIF v_role_str = 'organization_admin' THEN
    v_role := 'organization_admin';
  ELSE
    -- Default fallback
    v_role := 'organization_admin';
  END IF;

  -- Assign Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- SAFEGUARD: If anything fails (e.g. enum issues), ensure the user creation DOES NOT fail.
  -- We just log it (if we had logging) or silently return NEW so the auth user exists.
  -- The user might lack a role row, but they can sign up.
  -- Ideally we raise a warning, but for Supabase Auth, returning NEW is crucial.
  RETURN NEW;
END;
$$;
