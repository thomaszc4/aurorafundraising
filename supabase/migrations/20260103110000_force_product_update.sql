-- Force update of products table
-- Clear existing products
DELETE FROM public.products;

-- Seed Specific QuickStove Products
INSERT INTO public.products (name, description, price, image_url, is_active, category)
VALUES 
  ('Quickstove Emergency Kit', 'Essential emergency preparedness stove kit. Compact and reliable.', 30.00, '/images/just_stove_v2.png', true, 'Emergency Prep'),
  ('QuickStove Cook Kit', 'Complete cooking solution with pot and accessories.', 45.00, '/images/quickstove.png', true, 'Camping')
ON CONFLICT DO NOTHING;
