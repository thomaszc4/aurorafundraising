-- ==========================================
-- INSPECT USER ROLES & METADATA
-- ==========================================

SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    p.full_name as profile_name,
    ur.role as assigned_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'individual1@glmail.com';
