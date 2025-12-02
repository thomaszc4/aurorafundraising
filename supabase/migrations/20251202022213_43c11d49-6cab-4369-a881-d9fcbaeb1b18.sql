-- Fix search_path for trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_student_total_raised()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.student_fundraiser_id IS NOT NULL THEN
    UPDATE public.student_fundraisers
    SET total_raised = COALESCE(total_raised, 0) + NEW.profit_amount
    WHERE id = NEW.student_fundraiser_id;
  END IF;
  RETURN NEW;
END;
$$;