-- ==========================================
-- PROMOTE USER TO ADMIN
-- ==========================================
-- Since 'admin@test.com' is stuck, we will promote your 
-- WORKING account instead.

-- Replace this with your new email if different
DO $$
DECLARE
  target_email text := 'aurora.test.736@gmail.com'; 
BEGIN
  -- 1. Ensure User exists in Profiles
  -- (Trigger should have done this, but we double check)
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  SELECT id, email, 'Admin User', now(), now()
  FROM auth.users WHERE email = target_email
  ON CONFLICT (id) DO NOTHING;

  -- 2. Grant Admin Role
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::app_role
  FROM auth.users WHERE email = target_email
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;
