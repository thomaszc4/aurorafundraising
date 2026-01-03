-- Fix RLS for campaign_tasks to ensure organization admins can insert tasks

-- Drop the old policy which might be causing issues (ambiguous for INSERT?)
DROP POLICY IF EXISTS "Admins can manage tasks for their campaigns" ON public.campaign_tasks;

-- Re-create explicit policies

-- SELECT: Allow if user is the org admin of the campaign OR is a system admin
DROP POLICY IF EXISTS "Admins can view tasks for their campaigns" ON public.campaign_tasks;
CREATE POLICY "Admins can view tasks for their campaigns"
ON public.campaign_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_tasks.campaign_id
    AND (c.organization_admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
  )
);

-- INSERT: Allow if user is the org admin of the campaign OR is a system admin
DROP POLICY IF EXISTS "Admins can insert tasks for their campaigns" ON public.campaign_tasks;
CREATE POLICY "Admins can insert tasks for their campaigns"
ON public.campaign_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_id
    AND (c.organization_admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
  )
);

-- UPDATE: Allow if user is the org admin of the campaign OR is a system admin
DROP POLICY IF EXISTS "Admins can update tasks for their campaigns" ON public.campaign_tasks;
CREATE POLICY "Admins can update tasks for their campaigns"
ON public.campaign_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_tasks.campaign_id
    AND (c.organization_admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
  )
);

-- DELETE: Allow if user is the org admin of the campaign OR is a system admin
DROP POLICY IF EXISTS "Admins can delete tasks for their campaigns" ON public.campaign_tasks;
CREATE POLICY "Admins can delete tasks for their campaigns"
ON public.campaign_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_tasks.campaign_id
    AND (c.organization_admin_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
  )
);
