-- Add task_states JSONB column to participants to track manual task completion
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS task_states JSONB DEFAULT '{}'::jsonb;

-- Update existing participants to have empty task states if they don't have it
UPDATE public.participants 
SET task_states = '{}'::jsonb 
WHERE task_states IS NULL;
