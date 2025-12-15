-- Add fundraiser_type column to campaigns table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'fundraiser_type') THEN
        ALTER TABLE campaigns ADD COLUMN fundraiser_type text;
    END IF;
END $$;

-- Add check constraint to ensure valid types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_fundraiser_type_check') THEN
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_fundraiser_type_check 
        CHECK (fundraiser_type IN ('product', 'donation', 'event', 'other_athon', 'pledge_per_unit', 'flat_donation'));
    END IF;
END $$;
