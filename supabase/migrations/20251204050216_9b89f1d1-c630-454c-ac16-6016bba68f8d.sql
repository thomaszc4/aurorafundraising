-- Create scheduled_emails table for email scheduling
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  recipient_segment TEXT DEFAULT 'all',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add marketing consent fields to donors table
ALTER TABLE public.donors 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS marketing_consent_ip TEXT;

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_emails
CREATE POLICY "Admins can manage scheduled emails for their campaigns"
ON public.scheduled_emails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = scheduled_emails.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Super admins can manage all scheduled emails"
ON public.scheduled_emails
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_scheduled_emails_scheduled_for ON public.scheduled_emails(scheduled_for) WHERE status = 'scheduled';