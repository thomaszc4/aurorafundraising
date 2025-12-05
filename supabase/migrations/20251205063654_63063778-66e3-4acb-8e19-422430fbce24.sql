-- Create campaign-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-logos', 'campaign-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for campaign logos
CREATE POLICY "Anyone can view campaign logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-logos');

CREATE POLICY "Authenticated users can upload campaign logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own campaign logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own campaign logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);

-- Add brand_colors column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT NULL;

-- Create student_tasks table for individual student task tracking
CREATE TABLE IF NOT EXISTS public.student_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_fundraiser_id UUID NOT NULL REFERENCES public.student_fundraisers(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on student_tasks
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_tasks
CREATE POLICY "Admins can manage all student tasks"
ON public.student_tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = student_tasks.campaign_id 
    AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Students can view their own tasks"
ON public.student_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_fundraisers sf
    WHERE sf.id = student_tasks.student_fundraiser_id
    AND sf.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own tasks"
ON public.student_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM student_fundraisers sf
    WHERE sf.id = student_tasks.student_fundraiser_id
    AND sf.student_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_student_tasks_updated_at
BEFORE UPDATE ON public.student_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();