-- Add Donation Product
-- Check if it exists first to avoid duplicates
DO $$
BEGIN
    -- Ensure cost column exists (was missing in schema but used in backend)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost') THEN
        ALTER TABLE public.products ADD COLUMN cost numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'General Donation' AND price = 1.00) THEN
        INSERT INTO public.products (name, description, price, image_url, is_active, category, cost)
        VALUES (
          'General Donation',
          'Custom amount donation to support the campaign.',
          1.00,
          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150&q=80',
          true,
          'Donation',
          0.00
        );
    END IF;
END $$;
