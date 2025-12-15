-- ==========================================
-- MANUALLY VERIFY EMAIL ADDRESS
-- ==========================================

-- 1. Verify the specific user 'individual1@glmail.com'
-- This sets the confirmed timestamp, bypassing the email link requirement.
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'individual1@glmail.com';

-- 2. (Optional) Verify ALL currently pending users
-- Uncomment this if you want to verify everyone stuck in "Waiting for verification"
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(),
--     updated_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- ==========================================
-- NOTE ON DISABLING VERIFICATION GLOBALLY:
-- ==========================================
-- To permanently turn off email verification for ALL future users:
-- 1. Go to your Supabase Dashboard.
-- 2. Click "Authentication" (on the left sidebar).
-- 3. Click "Providers".
-- 4. Click "Email".
-- 5. Toggle "Confirm email" to OFF.
-- 6. Click "Save".
-- DO NOT rely on SQL triggers for this; the Dashboard setting is the correct way.
