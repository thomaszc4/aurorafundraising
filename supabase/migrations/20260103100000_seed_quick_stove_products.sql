-- Add columns if they don't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Clear existing products to ensure only the requested 2 items exist
DELETE FROM public.products;

-- Seed Specific QuickStove Products
INSERT INTO public.products (name, description, price, image_url, is_active, category)
VALUES 
  ('Quickstove Emergency Kit', 'Essential emergency preparedness stove kit. Compact and reliable.', 30.00, '/images/Just_Stove.png', true, 'Emergency Prep'),
  ('QuickStove Cook Kit', 'Complete cooking solution with pot and accessories.', 45.00, '/images/quickstove.png', true, 'Camping')
ON CONFLICT DO NOTHING;
