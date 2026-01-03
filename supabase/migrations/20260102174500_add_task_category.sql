-- Add category column to campaign_tasks
ALTER TABLE public.campaign_tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Update existing tasks with some intelligent defaults if possible, otherwise 'General'
UPDATE public.campaign_tasks 
SET category = 'General' 
WHERE category IS NULL;
