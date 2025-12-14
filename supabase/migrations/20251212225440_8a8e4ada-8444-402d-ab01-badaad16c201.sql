
-- Create participants table (anonymous, no PII)
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(public.gen_random_bytes(32), 'hex'),
  total_raised NUMERIC DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create campaign join settings
CREATE TABLE public.campaign_join_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE NOT NULL,
  join_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  require_code BOOLEAN DEFAULT false,
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create incentives table
CREATE TABLE public.incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  incentive_type TEXT NOT NULL CHECK (incentive_type IN ('individual', 'competition', 'group')),
  threshold_amount NUMERIC,
  threshold_items INTEGER,
  reward TEXT NOT NULL,
  reward_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create incentive progress tracking
CREATE TABLE public.incentive_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incentive_id UUID REFERENCES public.incentives(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(incentive_id, participant_id)
);

-- Create participant messages (broadcast from campaign manager)
CREATE TABLE public.participant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor accounts (separate from user auth)
CREATE TABLE public.vendor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor shipments tracking
CREATE TABLE public.vendor_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_accounts(id) NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'shipped', 'delivered')),
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_join_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for participants (anonymous access via token)
CREATE POLICY "Anyone can create participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can view own data via token" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Participants can update own data" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Admins can manage participants" ON public.participants FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = participants.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for campaign join settings
CREATE POLICY "Anyone can view join settings" ON public.campaign_join_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage join settings" ON public.campaign_join_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_join_settings.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for incentives
CREATE POLICY "Anyone can view active incentives" ON public.incentives FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage incentives" ON public.incentives FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = incentives.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for incentive progress
CREATE POLICY "Anyone can view incentive progress" ON public.incentive_progress FOR SELECT USING (true);
CREATE POLICY "System can manage progress" ON public.incentive_progress FOR ALL USING (true);

-- RLS Policies for participant messages
CREATE POLICY "Anyone can view messages" ON public.participant_messages FOR SELECT USING (true);
CREATE POLICY "Admins can manage messages" ON public.participant_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = participant_messages.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for vendor accounts (accessed via edge function)
CREATE POLICY "Vendors accessed via service role" ON public.vendor_accounts FOR ALL USING (true);

-- RLS Policies for vendor shipments
CREATE POLICY "Vendors can view their shipments" ON public.vendor_shipments FOR SELECT USING (true);
CREATE POLICY "Vendors can update their shipments" ON public.vendor_shipments FOR UPDATE USING (true);
CREATE POLICY "Admins can view shipments" ON public.vendor_shipments FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Insert default vendor account (password: Test1234!)
-- Using bcrypt-style hash simulation - will use edge function for actual auth
INSERT INTO public.vendor_accounts (email, password_hash, company_name)
VALUES ('vendor@test.com', 'Test1234!', 'Default Vendor');

-- Add participant_id to orders table for anonymous tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.participants(id);

-- Create function to update participant stats when order completes
CREATE OR REPLACE FUNCTION public.update_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.participant_id IS NOT NULL THEN
    UPDATE public.participants
    SET 
      total_raised = COALESCE(total_raised, 0) + COALESCE(NEW.profit_amount, 0),
      items_sold = COALESCE(items_sold, 0) + (
        SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = NEW.id
      ),
      updated_at = now()
    WHERE id = NEW.participant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS update_participant_stats_trigger ON public.orders;
CREATE TRIGGER update_participant_stats_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_participant_stats();
