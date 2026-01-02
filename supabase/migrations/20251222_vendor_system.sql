-- Migration: Vendor System, Purchase Orders, and Product Cost
-- Date: 2025-12-23 (Updated)
-- Uses existing 'vendor_accounts' table instead of creating 'vendors'

BEGIN;

-- 1. Update Products Table
-- Add vendor_id referencing vendor_accounts, and cost_price
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendor_accounts(id),
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;

-- 2. Purchase Orders Table
-- We need to check if the type already exists, if not create it.
DO $$ BEGIN
    CREATE TYPE public.purchase_order_status AS ENUM ('generated', 'sent', 'acknowledged', 'shipped', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
    vendor_id UUID REFERENCES public.vendor_accounts(id), 
    status public.purchase_order_status DEFAULT 'generated',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    tracking_number TEXT,
    notes TEXT
);

-- RLS for Purchase Orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PO Read Public" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "PO Admin Write" ON public.purchase_orders FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    )
);

-- 3. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name_snapshot TEXT,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL, 
    total_cost DECIMAL(10,2) NOT NULL
);

-- RLS for PO Items
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PO Items Read Public" ON public.purchase_order_items FOR SELECT USING (true);


-- 4. Helper Function: Generate Purchase Order
CREATE OR REPLACE FUNCTION public.generate_purchase_order(
    p_campaign_id UUID,
    p_vendor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_po_id UUID;
    v_total_cost DECIMAL(10,2);
BEGIN
    -- 1. Create the Purchase Order Record
    INSERT INTO public.purchase_orders (campaign_id, vendor_id, status, generated_at)
    VALUES (p_campaign_id, p_vendor_id, 'generated', NOW())
    RETURNING id INTO v_po_id;

    -- 2. Aggregate Items and Insert into PO Items
    INSERT INTO public.purchase_order_items (purchase_order_id, product_id, product_name_snapshot, quantity, unit_cost, total_cost)
    SELECT 
        v_po_id,
        oi.product_id,
        p.name,
        SUM(oi.quantity),
        COALESCE(p.cost_price, 0), -- Use current cost price
        SUM(oi.quantity) * COALESCE(p.cost_price, 0)
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.campaign_id = p_campaign_id
      AND o.status = 'completed' -- Only completed orders
      AND (p.vendor_id = p_vendor_id OR p.vendor_id IS NULL) -- Filter by vendor
    GROUP BY oi.product_id, p.name, p.cost_price;

    -- 3. Update PO Total Amount
    SELECT SUM(total_cost) INTO v_total_cost
    FROM public.purchase_order_items
    WHERE purchase_order_id = v_po_id;

    UPDATE public.purchase_orders
    SET total_amount = COALESCE(v_total_cost, 0)
    WHERE id = v_po_id;

    -- 4. Mark Campaign as Closed/Completed
    UPDATE public.campaigns
    SET status = 'completed', end_date = LEAST(end_date, NOW())
    WHERE id = p_campaign_id;

    RETURN v_po_id;
END;
$$;


-- 5. Helper Function: Get Campaign Orders Summary (for Live View)
CREATE OR REPLACE FUNCTION public.get_campaign_product_summary(p_campaign_id UUID)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    total_quantity BIGINT,
    vendor_id UUID
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        oi.product_id,
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        p.vendor_id
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.campaign_id = p_campaign_id
    AND o.status IN ('completed', 'pending') -- Show pending too
    GROUP BY oi.product_id, p.name, p.vendor_id;
$$;

COMMIT;
