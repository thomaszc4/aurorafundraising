-- Enable RLS on tables flagged by Supabase linter
-- Tables: campaign_products, products, orders, order_items

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. PRODUCTS TABLE POLICIES
-- Products should be publicly readable (for customers browsing)
-- Only super_admin can modify
-- ============================================

-- Allow anyone to read products
CREATE POLICY "Products are publicly readable"
ON public.products
FOR SELECT
TO public
USING (true);

-- Only super_admin can insert products
CREATE POLICY "Super admin can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Only super_admin can update products
CREATE POLICY "Super admin can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Only super_admin can delete products
CREATE POLICY "Super admin can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================
-- 3. CAMPAIGN_PRODUCTS TABLE POLICIES
-- Links between campaigns and products
-- Readable by anyone, modifiable by campaign admin or super_admin
-- ============================================

-- Allow anyone to read campaign_products (needed for public product display)
CREATE POLICY "Campaign products are publicly readable"
ON public.campaign_products
FOR SELECT
TO public
USING (true);

-- Campaign admin or super_admin can insert
CREATE POLICY "Admin can insert campaign products"
ON public.campaign_products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Campaign admin or super_admin can update
CREATE POLICY "Admin can update campaign products"
ON public.campaign_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Campaign admin or super_admin can delete
CREATE POLICY "Admin can delete campaign products"
ON public.campaign_products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ============================================
-- 4. ORDERS TABLE POLICIES
-- Orders are sensitive - restrict access
-- ============================================

-- Admins can read all orders for their campaigns
CREATE POLICY "Admin can read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Allow public (unauthenticated) users to create orders (checkout flow)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can update orders (e.g., status changes)
CREATE POLICY "Admin can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Only super_admin can delete orders
CREATE POLICY "Super admin can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================
-- 5. ORDER_ITEMS TABLE POLICIES
-- Order items follow the same pattern as orders
-- ============================================

-- Admins can read all order items
CREATE POLICY "Admin can read order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Allow public to insert order items (checkout flow)
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can update order items
CREATE POLICY "Admin can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Only super_admin can delete order items
CREATE POLICY "Super admin can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
