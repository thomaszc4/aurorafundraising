-- ==========================================
-- CLEAN SLATE: DELETE ADMIN USER
-- ==========================================
-- We will delete the "poisoned" admin user so you can 
-- Sign Up specifically as "admin@test.com" using the App/Debug Tool.
-- This ensures Supabase handles all the internal wiring correctly.

-- 1. Delete Identity (if exists)
DELETE FROM auth.identities WHERE email = 'admin@test.com';

-- 2. Delete User (cascades to profile, roles, etc.)
DELETE FROM auth.users WHERE email = 'admin@test.com';
