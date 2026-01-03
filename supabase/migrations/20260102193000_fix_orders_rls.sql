-- Fix RLS for orders, order_items, and student_fundraisers
-- This resolves the "Failed to load orders" error and ensures data integrity

-- 1. DEFENSIVE SCHEMA SYNC
-- Ensure critical columns exist before applying policies to avoid "column does not exist" errors
DO $$ 
BEGIN 
    -- Add student_fundraiser_id to orders if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'student_fundraiser_id') THEN
        ALTER TABLE public.orders ADD COLUMN student_fundraiser_id UUID REFERENCES public.student_fundraisers(id) ON DELETE SET NULL;
    END IF;

    -- Add participant_id to orders if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'participant_id') THEN
        ALTER TABLE public.orders ADD COLUMN participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. STUDENT_FUNDRAISERS RLS
-- Allows Orignization Admins to manage fundraisers for their own campaigns
DROP POLICY IF EXISTS "Admins can manage all fundraisers" ON public.student_fundraisers;
DROP POLICY IF EXISTS "Admins can manage fundraisers for their campaigns" ON public.student_fundraisers;

CREATE POLICY "Admins can manage fundraisers for their campaigns"
ON public.student_fundraisers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = public.student_fundraisers.campaign_id
    AND (
      c.organization_admin_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  )
);

-- 3. ORDERS RLS
-- Allows Organization Admins to view orders linked to their campaign's students or participants
DROP POLICY IF EXISTS "Admins can view and manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders for their campaigns" ON public.orders;

CREATE POLICY "Admins can manage orders for their campaigns"
ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.student_fundraisers sf
    JOIN public.campaigns c ON c.id = sf.campaign_id
    WHERE sf.id = public.orders.student_fundraiser_id
    AND (
      c.organization_admin_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.participants p
    JOIN public.campaigns c ON c.id = p.campaign_id
    WHERE p.id = public.orders.participant_id
    AND (
      c.organization_admin_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  )
);

-- 4. ORDER_ITEMS RLS
-- Order items inherit same access logic from their parent order
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items for their campaigns" ON public.order_items;

CREATE POLICY "Admins can manage order items for their campaigns"
ON public.order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.student_fundraisers sf ON sf.id = o.student_fundraiser_id
    LEFT JOIN public.participants p ON p.id = o.participant_id
    LEFT JOIN public.campaigns c ON (c.id = sf.campaign_id OR c.id = p.campaign_id)
    WHERE o.id = public.order_items.order_id
    AND (
      c.organization_admin_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  )
);

-- 5. ENSURE RLS IS ENABLED (Final check)
ALTER TABLE public.student_fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
