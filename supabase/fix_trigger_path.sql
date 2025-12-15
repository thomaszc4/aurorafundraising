-- ==========================================
-- FIX: FUNCTION SEARCH PATH (The Crash Cause?)
-- ==========================================
-- If "gen_random_uuid()" is in the "extensions" schema, 
-- and the function only sees "public", it crashes (500 Error).

CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 1. Redefine function with CORRECT search_path
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, extensions -- <--- CRITICAL FIX
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

-- 2. Ensure Trigger is strictly AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant usage on extensions just in case
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
