-- ==========================================
-- ADD INDIVIDUAL ROLE & FIX ROLE ASSIGNMENT
-- ==========================================

-- 1. Add 'individual' to the app_role enum
-- We have to do this carefully as Postgres enums are immutable in some contexts
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'individual';

-- 2. Update the handle_new_user trigger to ASSIGN ROLES
-- Previously, it only created the profile. Now it must also assign the role.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- 2. Determine Role from Metadata (Default to 'organization_admin' if not specified)
  -- We trust the client to send 'individual' or 'organization_admin' in raw_user_meta_data
  v_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
  
  -- Fallback if no role provided or invalid (default to organization_admin for now, or student?)
  -- SAFEGUARD: If no role specified, assume it's a standard org admin sign up.
  IF v_role IS NULL THEN
    v_role := 'organization_admin';
  END IF;

  -- 3. Assign Role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
