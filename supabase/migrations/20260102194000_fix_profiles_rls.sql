-- Allow organization admins to view profiles of students in their campaigns
-- This prevents join failures when fetching orders with student names

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- System Admins
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  OR
  -- Users viewing their own profile
  auth.uid() = id
  OR
  -- Organization Admins viewing students/participants in their campaigns
  EXISTS (
    SELECT 1 FROM public.student_fundraisers sf
    JOIN public.campaigns c ON c.id = sf.campaign_id
    WHERE sf.student_id = public.profiles.id
    AND c.organization_admin_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.participants p
    JOIN public.campaigns c ON c.id = p.campaign_id
    WHERE p.id = public.profiles.id -- only if participants are linked to profiles
    AND c.organization_admin_id = auth.uid()
  )
);
