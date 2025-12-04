-- Add available_fundraiser_types column to store which types super admin has enabled
-- This will be a system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage system settings
CREATE POLICY "Super admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone can view system settings
CREATE POLICY "Anyone can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Insert default enabled fundraiser types
INSERT INTO public.system_settings (key, value) 
VALUES ('enabled_fundraiser_types', '["product", "walkathon", "readathon", "jogathon", "dance-athon", "bike-athon", "swim-athon", "jump-rope-athon", "gala-auction", "carnival", "trivia-night", "talent-show", "golf-tournament", "movie-night"]'::jsonb)
ON CONFLICT (key) DO NOTHING;