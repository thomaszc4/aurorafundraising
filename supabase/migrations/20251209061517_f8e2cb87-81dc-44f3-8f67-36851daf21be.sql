-- Create campaign automation settings table
CREATE TABLE public.campaign_automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  automation_mode TEXT NOT NULL DEFAULT 'manual' CHECK (automation_mode IN ('manual', 'approval_required', 'autopilot')),
  auto_send_invitations BOOLEAN NOT NULL DEFAULT true,
  auto_send_reminders BOOLEAN NOT NULL DEFAULT true,
  auto_celebrate_milestones BOOLEAN NOT NULL DEFAULT true,
  auto_thank_donors BOOLEAN NOT NULL DEFAULT true,
  auto_generate_social_posts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Create automation log table for tracking all automated actions
CREATE TABLE public.automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'failed', 'skipped')),
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES public.profiles(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add enhanced task fields to campaign_tasks
ALTER TABLE public.campaign_tasks 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'navigate',
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_function TEXT,
ADD COLUMN IF NOT EXISTS detailed_instructions TEXT,
ADD COLUMN IF NOT EXISTS can_auto_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.campaign_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_automation_settings
CREATE POLICY "Admins can manage automation settings for their campaigns"
ON public.campaign_automation_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_automation_settings.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Super admins can manage all automation settings"
ON public.campaign_automation_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for automation_log
CREATE POLICY "Admins can view automation logs for their campaigns"
ON public.automation_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = automation_log.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "System can insert automation logs"
ON public.automation_log
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage all automation logs"
ON public.automation_log
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_campaign_automation_settings_updated_at
BEFORE UPDATE ON public.campaign_automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();