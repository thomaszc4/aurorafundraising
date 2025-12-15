-- ==========================================
-- CLEANUP ORPHANED AUTH USERS
-- ==========================================

-- The previous "Nuclear Reset" wiped the public data (Profiles), 
-- but Supabase's internal "auth.users" table still holds the accounts.
-- This causes "User already registered" errors or "Database errors" on login.

-- This script attempts to delete the specific test users so you can sign them up again fresh.

-- Note: You need high-level permissions to delete from auth.users. 
-- If this script fails, please delete the users manually in the Supabase Dashboard > Authentication > Users.

BEGIN;

DELETE FROM auth.users 
WHERE email IN (
    'admin@test.com', 
    'individual1@gmail.com', 
    'individual1@email.com',
    'student@test.com',
    'org@test.com'
);

COMMIT;
