-- Add all potentially missing columns to campaigns table for Individual Flow
DO $$
BEGIN
    -- fundraiser_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'fundraiser_type') THEN
        ALTER TABLE campaigns ADD COLUMN fundraiser_type text;
    END IF;

    -- logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'logo_url') THEN
        ALTER TABLE campaigns ADD COLUMN logo_url text;
    END IF;

    -- organization_name (for meta storage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'organization_name') THEN
        ALTER TABLE campaigns ADD COLUMN organization_name text;
    END IF;

    -- program_name (for meta storage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'program_name') THEN
        ALTER TABLE campaigns ADD COLUMN program_name text;
    END IF;

    -- start_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'start_date') THEN
        ALTER TABLE campaigns ADD COLUMN start_date timestamptz DEFAULT now();
    END IF;

    -- end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'end_date') THEN
        ALTER TABLE campaigns ADD COLUMN end_date timestamptz;
    END IF;

END $$;

-- Add check constraint for fundraiser_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'campaigns' AND constraint_name = 'campaigns_fundraiser_type_check') THEN
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_fundraiser_type_check 
        CHECK (fundraiser_type IN ('product', 'donation', 'event', 'other_athon', 'pledge_per_unit', 'flat_donation'));
    END IF;
END $$;
