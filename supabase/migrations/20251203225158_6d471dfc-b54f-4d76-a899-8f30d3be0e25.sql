-- Add fundraiser type enum
CREATE TYPE public.fundraiser_type AS ENUM ('product', 'walkathon', 'readathon', 'jogathon', 'other_athon');

-- Add athon donation type enum
CREATE TYPE public.athon_donation_type AS ENUM ('pledge_per_unit', 'flat_donation');

-- Add columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN fundraiser_type fundraiser_type NOT NULL DEFAULT 'product',
ADD COLUMN athon_donation_type athon_donation_type,
ADD COLUMN athon_unit_name text,
ADD COLUMN selected_product_ids uuid[] DEFAULT '{}';

-- Remove status column constraint to allow NULL temporarily, then drop
ALTER TABLE public.campaigns ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.campaigns ALTER COLUMN status DROP DEFAULT;

-- Create student_invitations table for tracking students to invite
CREATE TABLE public.student_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  student_email text NOT NULL,
  invitation_sent boolean DEFAULT false,
  invitation_sent_at timestamp with time zone,
  account_created boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, student_email)
);

ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_invitations
CREATE POLICY "Super admins can manage all invitations"
ON public.student_invitations FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage invitations for their campaigns"
ON public.student_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = student_invitations.campaign_id
    AND c.organization_admin_id = auth.uid()
  )
);

-- Create athon_pledges table for pledge-based donations
CREATE TABLE public.athon_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fundraiser_id uuid REFERENCES public.student_fundraisers(id) ON DELETE CASCADE NOT NULL,
  supporter_name text NOT NULL,
  supporter_email text NOT NULL,
  pledge_amount numeric NOT NULL,
  is_flat_donation boolean DEFAULT false,
  units_completed integer DEFAULT 0,
  total_amount numeric GENERATED ALWAYS AS (
    CASE WHEN is_flat_donation THEN pledge_amount ELSE pledge_amount * units_completed END
  ) STORED,
  paid boolean DEFAULT false,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.athon_pledges ENABLE ROW LEVEL SECURITY;

-- RLS policies for athon_pledges
CREATE POLICY "Anyone can create pledges"
ON public.athon_pledges FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage all pledges"
ON public.athon_pledges FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Students can view their own pledges"
ON public.athon_pledges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_fundraisers sf
    WHERE sf.id = athon_pledges.student_fundraiser_id
    AND sf.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can view pledges for their campaigns"
ON public.athon_pledges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_fundraisers sf
    JOIN public.campaigns c ON c.id = sf.campaign_id
    WHERE sf.id = athon_pledges.student_fundraiser_id
    AND c.organization_admin_id = auth.uid()
  )
);

-- Create campaign_products junction table for selected products
CREATE TABLE public.campaign_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, product_id)
);

ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign products"
ON public.campaign_products FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage campaign products"
ON public.campaign_products FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage products for their campaigns"
ON public.campaign_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_products.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Add average_raised_per_student to products for display
ALTER TABLE public.products ADD COLUMN average_raised_per_student numeric DEFAULT 0;