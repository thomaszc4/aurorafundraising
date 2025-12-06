-- Phase 2: Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'campaign_manager',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add category column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Phase 3: Create post_templates table
CREATE TABLE public.post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('launch', 'progress', 'urgency')),
  platform TEXT NOT NULL DEFAULT 'all',
  post_template TEXT NOT NULL,
  comment_template TEXT,
  base_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on post_templates
ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

-- Create campaign_posts table
CREATE TABLE public.campaign_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  post_template_id UUID REFERENCES public.post_templates(id) ON DELETE CASCADE NOT NULL,
  customized_post TEXT,
  customized_comment TEXT,
  generated_image_url TEXT,
  selected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_participant_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, post_template_id)
);

-- Enable RLS on campaign_posts
ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Org admins can manage their organizations"
ON public.organizations FOR ALL
USING (org_admin_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view organizations"
ON public.organizations FOR SELECT
USING (true);

-- RLS Policies for organization_members
CREATE POLICY "Org admins can manage members"
ON public.organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND (o.org_admin_id = auth.uid() OR has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Members can view their membership"
ON public.organization_members FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for post_templates
CREATE POLICY "Super admins can manage post templates"
ON public.post_templates FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active post templates"
ON public.post_templates FOR SELECT
USING (is_active = true);

-- RLS Policies for campaign_posts
CREATE POLICY "Campaign managers can manage campaign posts"
ON public.campaign_posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_posts.campaign_id
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Participants can view their campaign posts"
ON public.campaign_posts FOR SELECT
USING (
  is_participant_visible = true AND
  EXISTS (
    SELECT 1 FROM public.student_fundraisers sf
    WHERE sf.campaign_id = campaign_posts.campaign_id
    AND sf.student_id = auth.uid()
  )
);

-- Create storage bucket for post templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-templates', 'post-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-templates bucket
CREATE POLICY "Super admins can upload post templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-templates' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view post template images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-templates');

CREATE POLICY "Super admins can update post templates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-templates' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete post templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-templates' AND has_role(auth.uid(), 'super_admin'));