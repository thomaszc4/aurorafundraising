-- ==========================================
-- CONFIRM EMAIL ADDRESS
-- ==========================================
-- Simulates clicking the "Confirm Email" link.

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'aurora.test.736@gmail.com';
