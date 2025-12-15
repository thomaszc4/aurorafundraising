-- ==========================================
-- SECURITY AUDIT REPORT
-- ==========================================
-- Run this to see potential vulnerabilities.

-- 1. Tables with RLS DISABLED (CRITICAL)
-- These tables are potentially readable/writable by anyone if grants exist.
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;

-- 2. Tables with RLS ENABLED but NO POLICIES (WARNING)
-- These tables are effectively "Private" (no one can access via API), 
-- which might be intended, or might lock users out.
SELECT 
    t.schemaname, 
    t.tablename 
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true 
  AND p.policyname IS NULL;

-- 3. Check for broad 'service_role' grants (INFO)
-- (Just a sanity check)
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE');
