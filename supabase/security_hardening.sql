-- ==========================================
-- SECURITY HARDENING SCRIPT
-- ==========================================

-- 1. FORCE ENABLE RLS (Defense in Depth)
-- Ensure RLS is enabled on ALL public tables.
-- even if they were already enabled, this is safe.
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename); 
    END LOOP; 
END $$;


-- 2. REVOKE SENSITIVE WRITE PERMISSIONS FROM 'anon'
-- 'anon' (unauthenticated users) should NEVER be able to write to these tables.
-- This prevents issues even if specific RLS policies are weak/missing.

-- Admin & System Configuration tables
REVOKE INSERT, UPDATE, DELETE ON public.campaigns FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.organizations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.organization_members FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.system_settings FROM anon;

-- Content & Templates (Admin managed)
REVOKE INSERT, UPDATE, DELETE ON public.email_templates FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.post_templates FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.resources FROM anon;

-- Vendor Data
REVOKE INSERT, UPDATE, DELETE ON public.vendor_accounts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.vendor_shipments FROM anon;

-- Product Data (Admin managed)
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.campaign_products FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.product_images FROM anon;

-- NOTE: We DO NOT revoke from 'orders', 'participants', or 'donors' 
-- because legitimate unauthenticated users (donors/parents) may need to 
-- create these during donation/sign-up flows (subject to RLS).

-- 3. VERIFICATION (Optional Debug)
-- Confirm revocations
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'anon' 
  AND table_name IN ('campaigns', 'user_roles')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE');
