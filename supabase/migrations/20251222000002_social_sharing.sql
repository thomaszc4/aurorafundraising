-- Social Share Templates table
-- Allows admins to create reusable social media post templates for their campaigns
-- Participants can then use these templates with their unique referral links auto-injected

CREATE TABLE IF NOT EXISTS public.social_share_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'sms', 'email', 'generic')),
    title TEXT NOT NULL,
    content_template TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster campaign lookups
CREATE INDEX IF NOT EXISTS idx_social_share_templates_campaign_id ON public.social_share_templates(campaign_id);

-- Enable RLS
ALTER TABLE public.social_share_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign admins can manage their own templates
DROP POLICY IF EXISTS social_share_templates_admin_policy ON public.social_share_templates;
CREATE POLICY social_share_templates_admin_policy ON public.social_share_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = social_share_templates.campaign_id
            AND c.organization_admin_id = auth.uid()
        )
    );

-- Policy: Student fundraisers can read active templates for their campaign
DROP POLICY IF EXISTS social_share_templates_student_read_policy ON public.social_share_templates;
CREATE POLICY social_share_templates_student_read_policy ON public.social_share_templates
    FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.student_fundraisers sf
            WHERE sf.campaign_id = social_share_templates.campaign_id
            AND sf.student_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_share_templates TO authenticated;
