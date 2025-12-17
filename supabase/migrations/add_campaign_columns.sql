-- Migration: Add missing columns to campaigns table
-- Run this in your Supabase Dashboard > SQL Editor

-- Add program_size column (integer for number of participants)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS program_size integer;

-- Add athon_donation_type column (for walkathon/readathon type fundraisers)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS athon_donation_type text;

-- Add athon_unit_name column (e.g., "laps", "pages", "miles")
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS athon_unit_name text;

-- Add brand_colors column (JSON object with primary, secondary, accent colors)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS brand_colors jsonb;

-- Optional: Add comments for documentation
COMMENT ON COLUMN campaigns.program_size IS 'Number of students/participants in the program';
COMMENT ON COLUMN campaigns.athon_donation_type IS 'Type of athon donation: pledge_per_unit or flat_donation';
COMMENT ON COLUMN campaigns.athon_unit_name IS 'Unit name for athon fundraisers (e.g., laps, pages, miles)';
COMMENT ON COLUMN campaigns.brand_colors IS 'JSON object with extracted brand colors: {primary, secondary, accent}';
