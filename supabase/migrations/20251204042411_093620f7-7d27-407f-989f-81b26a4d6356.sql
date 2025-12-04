-- Add profile fields for additional info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS communication_preference text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS children_names text[];

-- Add organization type to campaigns
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS organization_type text DEFAULT 'school';

-- Create donor segments enum
CREATE TYPE public.donor_segment AS ENUM ('first_time', 'recurring', 'lapsed', 'major', 'business');

-- Create donors table for tracking donor information
CREATE TABLE public.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  segment donor_segment DEFAULT 'first_time',
  total_donated numeric DEFAULT 0,
  donation_count integer DEFAULT 0,
  first_donation_at timestamp with time zone,
  last_donation_at timestamp with time zone,
  communication_preference text DEFAULT 'email',
  notes text,
  interests text[],
  connection_to_org text,
  is_thanked boolean DEFAULT false,
  thanked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(campaign_id, email)
);

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage donors for their campaigns"
ON public.donors FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = donors.campaign_id 
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Super admins can manage all donors"
ON public.donors FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Create email templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template_type text NOT NULL, -- thank_you_first_time, thank_you_recurring, thank_you_major, impact_update, we_miss_you, welcome_monthly
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates for their campaigns"
ON public.email_templates FOR ALL
USING (
  campaign_id IS NULL OR
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = email_templates.campaign_id 
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Anyone can view system templates"
ON public.email_templates FOR SELECT
USING (is_system = true);

-- Create donor communications log
CREATE TABLE public.donor_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  communication_type text NOT NULL, -- email, call, handwritten_note
  subject text,
  content text,
  sent_at timestamp with time zone DEFAULT now(),
  sent_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.donor_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage communications for their campaigns"
ON public.donor_communications FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = donor_communications.campaign_id 
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

-- Create impact updates table
CREATE TABLE public.impact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  story text,
  stat_description text,
  stat_value text,
  image_url text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.impact_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage impact updates for their campaigns"
ON public.impact_updates FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = impact_updates.campaign_id 
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Anyone can view impact updates"
ON public.impact_updates FOR SELECT
USING (true);

-- Create donor retention metrics table
CREATE TABLE public.donor_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_donors integer DEFAULT 0,
  new_donors integer DEFAULT 0,
  repeat_donors integer DEFAULT 0,
  lapsed_donors integer DEFAULT 0,
  monthly_donors integer DEFAULT 0,
  retention_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(campaign_id, period_start, period_end)
);

ALTER TABLE public.donor_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metrics for their campaigns"
ON public.donor_metrics FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = donor_metrics.campaign_id 
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

-- Create scheduled donor tasks (for thank-you reminders, calls, etc.)
CREATE TABLE public.donor_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  task_type text NOT NULL, -- thank_you_email, thank_you_call, handwritten_note, follow_up
  due_date timestamp with time zone NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.donor_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage donor tasks for their campaigns"
ON public.donor_tasks FOR ALL
USING (EXISTS (
  SELECT 1 FROM campaigns c
  WHERE c.id = donor_tasks.campaign_id 
  AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
));

-- Insert system email templates
INSERT INTO public.email_templates (name, subject, body, template_type, is_system) VALUES
('First-Time Donor Thank You', 'Thank you for your first gift!', 'Dear {{donor_name}},

Thank you so much for your generous first donation of ${{amount}} to {{campaign_name}}! Your support means the world to us and helps make a real difference.

We are excited to have you join our community of supporters. Your gift will help us {{impact_description}}.

With gratitude,
{{organization_name}}', 'thank_you_first_time', true),

('Recurring Donor Thank You', 'Thank you for your continued support!', 'Dear {{donor_name}},

Thank you for your continued generosity! Your recent gift of ${{amount}} to {{campaign_name}} is truly appreciated.

As a returning supporter, you are helping us build something lasting. Your ongoing commitment allows us to {{impact_description}}.

With heartfelt thanks,
{{organization_name}}', 'thank_you_recurring', true),

('Major Donor Thank You', 'Your incredible generosity', 'Dear {{donor_name}},

We are deeply grateful for your extraordinary gift of ${{amount}} to {{campaign_name}}. Your generous support places you among our most valued partners.

Your significant contribution will have a tremendous impact, enabling us to {{impact_description}}.

We would love to connect with you personally to share more about how your gift is making a difference. Please expect a call from us soon.

With sincere appreciation,
{{organization_name}}', 'thank_you_major', true),

('We Miss You', 'We miss you!', 'Dear {{donor_name}},

We noticed it has been a while since we last heard from you, and we wanted to reach out.

Your past support of {{campaign_name}} made a real difference, and we miss having you as part of our community.

If there is anything we could do better or if you have any feedback, we would love to hear from you. And if you are able to give again, know that every contribution helps us continue our mission.

We hope to see you back soon!

Warmly,
{{organization_name}}', 'we_miss_you', true),

('Welcome Monthly Donor', 'Welcome to our monthly giving family!', 'Dear {{donor_name}},

Thank you for joining our monthly giving program! Your commitment of ${{amount}}/month is incredibly meaningful.

As a monthly donor, you provide us with steady, reliable support that allows us to plan ahead and maximize our impact. Here is what you can expect:
- Regular updates on how your donations are making a difference
- Exclusive behind-the-scenes stories
- First access to events and volunteer opportunities

Thank you for being such an important part of our mission!

With gratitude,
{{organization_name}}', 'welcome_monthly', true),

('Impact Update', 'See the difference you made!', 'Dear {{donor_name}},

We wanted to share some exciting news about the impact your support has made!

{{story}}

By the numbers: {{stat_description}}: {{stat_value}}

None of this would be possible without supporters like you. Thank you for being part of our journey.

With appreciation,
{{organization_name}}', 'impact_update', true);

-- Add trigger for updated_at
CREATE TRIGGER update_donors_updated_at
BEFORE UPDATE ON public.donors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_updates_updated_at
BEFORE UPDATE ON public.impact_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();