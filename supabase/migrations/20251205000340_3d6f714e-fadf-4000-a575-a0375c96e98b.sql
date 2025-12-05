-- Phase 1: Database Changes

-- 1. Allow multiple children with same parent email
-- First drop the unique constraint if it exists (using a function to handle if not exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'student_invitations_campaign_id_student_email_key') THEN
        ALTER TABLE public.student_invitations DROP CONSTRAINT student_invitations_campaign_id_student_email_key;
    END IF;
END
$$;

-- Add new unique constraint that allows same email for different student names
CREATE UNIQUE INDEX IF NOT EXISTS student_invitations_unique_student 
ON public.student_invitations (campaign_id, student_name, student_email);

-- 2. Create resources table for admin/student resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL DEFAULT 'file', -- 'file', 'link', 'article', 'post'
    url TEXT,
    file_path TEXT,
    content TEXT,
    is_visible_to_students BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    student_only_for UUID REFERENCES public.profiles(id), -- if set, only this student can see it
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for resources
CREATE POLICY "Admins can manage resources for their campaigns"
ON public.resources FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = resources.campaign_id
        AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

CREATE POLICY "Students can view resources shared with them"
ON public.resources FOR SELECT
USING (
    is_visible_to_students = true
    AND (student_only_for IS NULL OR student_only_for = auth.uid())
    AND EXISTS (
        SELECT 1 FROM student_fundraisers sf
        WHERE sf.campaign_id = resources.campaign_id
        AND sf.student_id = auth.uid()
    )
);

CREATE POLICY "Students can create their own private resources"
ON public.resources FOR INSERT
WITH CHECK (
    student_only_for = auth.uid()
    AND created_by = auth.uid()
);

CREATE POLICY "Students can manage their own resources"
ON public.resources FOR ALL
USING (
    student_only_for = auth.uid()
    AND created_by = auth.uid()
);

-- 3. Add delivery tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup', -- 'pickup', 'shipped', 'delivered'
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 4. Create feature_flags in system_settings
INSERT INTO public.system_settings (key, value)
VALUES ('feature_flags', '{"door_to_door_mode": true, "qr_codes": true, "ai_posts": true, "resources": true, "delivery_tracking": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Add logo_url column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 6. Create function to auto-link users on signup
CREATE OR REPLACE FUNCTION public.link_student_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Find matching invitation by email
    FOR invitation_record IN 
        SELECT id, campaign_id, student_name 
        FROM public.student_invitations 
        WHERE student_email = NEW.email 
        AND account_created = false
    LOOP
        -- Update invitation to mark account created
        UPDATE public.student_invitations
        SET user_id = NEW.id, account_created = true
        WHERE id = invitation_record.id;

        -- Create student fundraiser if not exists
        INSERT INTO public.student_fundraisers (
            student_id,
            campaign_id,
            page_slug,
            is_active
        )
        SELECT 
            NEW.id,
            invitation_record.campaign_id,
            LOWER(REGEXP_REPLACE(invitation_record.student_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
            true
        WHERE NOT EXISTS (
            SELECT 1 FROM public.student_fundraisers 
            WHERE student_id = NEW.id AND campaign_id = invitation_record.campaign_id
        );

        -- Add student role if not exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'student')
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to call the function after profile is created
DROP TRIGGER IF EXISTS on_profile_created_link_invitation ON public.profiles;
CREATE TRIGGER on_profile_created_link_invitation
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.link_student_invitation();