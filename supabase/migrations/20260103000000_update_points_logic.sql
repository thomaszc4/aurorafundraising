-- Update the points calculation logic: 1 item sold = 2 points
CREATE OR REPLACE FUNCTION update_participant_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate points balance: (items_sold * 2) minus total points spent on redemptions
  NEW.points_balance := (COALESCE(NEW.items_sold, 0) * 2) - COALESCE(
    (SELECT SUM(points_spent) 
     FROM public.rewards_redemptions 
     WHERE participant_id = NEW.id 
     AND status != 'cancelled'),
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate points for all existing participants
UPDATE public.participants
SET items_sold = items_sold; -- This triggers the update function
