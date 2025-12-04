-- Create table for donor survey responses
CREATE TABLE public.donor_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  would_recommend BOOLEAN,
  improvement_suggestions TEXT,
  preferred_update_frequency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for email A/B test variants
CREATE TABLE public.email_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  variant_a_template_id UUID REFERENCES public.email_templates(id),
  variant_b_template_id UUID REFERENCES public.email_templates(id),
  variant_a_subject TEXT NOT NULL,
  variant_b_subject TEXT NOT NULL,
  winner TEXT CHECK (winner IN ('a', 'b', NULL)),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for email tracking
CREATE TABLE public.email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_id UUID REFERENCES public.donor_communications(id) ON DELETE CASCADE,
  ab_test_id UUID REFERENCES public.email_ab_tests(id) ON DELETE CASCADE,
  variant TEXT CHECK (variant IN ('a', 'b')),
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0
);

-- Add display_on_wall column to donors for public recognition opt-in
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS display_on_wall BOOLEAN DEFAULT false;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Enable RLS
ALTER TABLE public.donor_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS for donor_surveys
CREATE POLICY "Admins can manage surveys for their campaigns"
ON public.donor_surveys FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = donor_surveys.campaign_id
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Anyone can submit surveys"
ON public.donor_surveys FOR INSERT
WITH CHECK (true);

-- RLS for email_ab_tests
CREATE POLICY "Admins can manage AB tests for their campaigns"
ON public.email_ab_tests FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = email_ab_tests.campaign_id
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- RLS for email_tracking
CREATE POLICY "Admins can view tracking for their campaigns"
ON public.email_tracking FOR ALL
USING (EXISTS (
  SELECT 1 FROM donors d
  JOIN campaigns c ON c.id = d.campaign_id
  WHERE d.id = email_tracking.donor_id
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "System can insert tracking records"
ON public.email_tracking FOR INSERT
WITH CHECK (true);