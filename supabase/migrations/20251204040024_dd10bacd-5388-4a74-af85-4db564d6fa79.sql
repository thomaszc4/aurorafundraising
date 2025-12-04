-- Create table for custom project manager tasks per campaign
CREATE TABLE public.campaign_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  task TEXT NOT NULL,
  description TEXT,
  days_before_event INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_custom BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage tasks for their campaigns"
ON public.campaign_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_tasks.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Super admins can manage all tasks"
ON public.campaign_tasks
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create table for task reminder notifications
CREATE TABLE public.task_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.campaign_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reminders"
ON public.task_reminders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage reminders for their campaigns"
ON public.task_reminders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = task_reminders.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_tasks_updated_at
BEFORE UPDATE ON public.campaign_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();