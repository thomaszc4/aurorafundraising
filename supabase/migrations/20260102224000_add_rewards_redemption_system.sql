-- Add rewards redemption system and t-shirt tracking
-- This migration adds the ability for participants to redeem points for rewards

-- Create rewards_redemptions table to track what participants have redeemed
CREATE TABLE IF NOT EXISTS public.rewards_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_participant_id ON public.rewards_redemptions(participant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_status ON public.rewards_redemptions(status);

-- Add new columns to participants table
-- Note: Using DO block to safely add columns if they don't exist
DO $$ 
BEGIN
  -- Add t-shirt size column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'tshirt_size'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN tshirt_size TEXT;
  END IF;

  -- Add t-shirt claimed flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'tshirt_claimed'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN tshirt_claimed BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add points balance (calculated: items_sold - sum of redemptions)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'items_sold'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN items_sold INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'points_balance'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN points_balance INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to automatically update points_balance based on items_sold
CREATE OR REPLACE FUNCTION update_participant_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate points balance: items_sold minus total points spent on redemptions
  NEW.points_balance := COALESCE(NEW.items_sold, 0) - COALESCE(
    (SELECT SUM(points_spent) 
     FROM public.rewards_redemptions 
     WHERE participant_id = NEW.id 
     AND status != 'cancelled'),
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update points_balance when items_sold changes
DROP TRIGGER IF EXISTS trigger_update_points_balance ON public.participants;
CREATE TRIGGER trigger_update_points_balance
  BEFORE UPDATE OF items_sold ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_points_balance();

-- Initialize points_balance for existing participants
UPDATE public.participants
SET points_balance = COALESCE(items_sold, 0)
WHERE points_balance IS NULL OR points_balance = 0;

-- Enable RLS on rewards_redemptions
ALTER TABLE public.rewards_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public/Participants access (Temporary: Auth model to be defined)
CREATE POLICY "Public can view redemptions"
  ON public.rewards_redemptions
  FOR SELECT
  USING (true);

-- RLS Policy: Public/Participants can insert redemptions
CREATE POLICY "Public can create redemptions"
  ON public.rewards_redemptions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.rewards_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'organization_admin')
    )
  );

-- RLS Policy: Admins can update redemption status
CREATE POLICY "Admins can update redemptions"
  ON public.rewards_redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'organization_admin')
    )
  );

-- Comment on table
COMMENT ON TABLE public.rewards_redemptions IS 'Tracks participant reward redemptions in the points-based incentive system';
