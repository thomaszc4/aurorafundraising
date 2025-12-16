-- Manual Migration File
-- Concatenated from recent migrations:
-- 1. 20251212225440_8a8e4ada-8444-402d-ab01-badaad16c201.sql
-- 2. 20251214000000_create_game_players.sql
-- 3. 20251214000500_create_game_structures.sql

-- =================================================================
-- START: Fixes & Overloads
-- =================================================================

-- Fix "function has_role(uuid, unknown) does not exist" error
-- The original function expects separate enum type, but these migrations pass text.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- =================================================================
-- START: 20251212225440_8a8e4ada-8444-402d-ab01-badaad16c201.sql
-- =================================================================

-- Create participants table (anonymous, no PII)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  total_raised NUMERIC DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create campaign join settings
CREATE TABLE IF NOT EXISTS public.campaign_join_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE NOT NULL,
  join_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  require_code BOOLEAN DEFAULT false,
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create incentives table
CREATE TABLE IF NOT EXISTS public.incentives (
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
CREATE TABLE IF NOT EXISTS public.incentive_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incentive_id UUID REFERENCES public.incentives(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(incentive_id, participant_id)
);

-- Create participant messages (broadcast from campaign manager)
CREATE TABLE IF NOT EXISTS public.participant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor accounts (separate from user auth)
CREATE TABLE IF NOT EXISTS public.vendor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor shipments tracking
CREATE TABLE IF NOT EXISTS public.vendor_shipments (
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
-- DROP commands added to make script re-runnable
DROP POLICY IF EXISTS "Anyone can create participants" ON public.participants;
CREATE POLICY "Anyone can create participants" ON public.participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can view own data via token" ON public.participants;
CREATE POLICY "Participants can view own data via token" ON public.participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Participants can update own data" ON public.participants;
CREATE POLICY "Participants can update own data" ON public.participants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can manage participants" ON public.participants;
CREATE POLICY "Admins can manage participants" ON public.participants FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = participants.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for campaign join settings
DROP POLICY IF EXISTS "Anyone can view join settings" ON public.campaign_join_settings;
CREATE POLICY "Anyone can view join settings" ON public.campaign_join_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage join settings" ON public.campaign_join_settings;
CREATE POLICY "Admins can manage join settings" ON public.campaign_join_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_join_settings.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for incentives
DROP POLICY IF EXISTS "Anyone can view active incentives" ON public.incentives;
CREATE POLICY "Anyone can view active incentives" ON public.incentives FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage incentives" ON public.incentives;
CREATE POLICY "Admins can manage incentives" ON public.incentives FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = incentives.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for incentive progress
DROP POLICY IF EXISTS "Anyone can view incentive progress" ON public.incentive_progress;
CREATE POLICY "Anyone can view incentive progress" ON public.incentive_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage progress" ON public.incentive_progress;
CREATE POLICY "System can manage progress" ON public.incentive_progress FOR ALL USING (true);

-- RLS Policies for participant messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.participant_messages;
CREATE POLICY "Anyone can view messages" ON public.participant_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.participant_messages;
CREATE POLICY "Admins can manage messages" ON public.participant_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns c WHERE c.id = participant_messages.campaign_id AND (c.organization_admin_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);

-- RLS Policies for vendor accounts (accessed via edge function)
DROP POLICY IF EXISTS "Vendors accessed via service role" ON public.vendor_accounts;
CREATE POLICY "Vendors accessed via service role" ON public.vendor_accounts FOR ALL USING (true);

-- RLS Policies for vendor shipments
DROP POLICY IF EXISTS "Vendors can view their shipments" ON public.vendor_shipments;
CREATE POLICY "Vendors can view their shipments" ON public.vendor_shipments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendors can update their shipments" ON public.vendor_shipments;
CREATE POLICY "Vendors can update their shipments" ON public.vendor_shipments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can view shipments" ON public.vendor_shipments;
CREATE POLICY "Admins can view shipments" ON public.vendor_shipments FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
);

-- Insert default vendor account
INSERT INTO public.vendor_accounts (email, password_hash, company_name)
VALUES ('vendor@test.com', 'Test1234!', 'Default Vendor')
ON CONFLICT (email) DO NOTHING;

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

-- =================================================================
-- START: 20251214000000_create_game_players.sql
-- =================================================================

DROP TABLE IF EXISTS public.game_players CASCADE;
create table public.game_players (
    id uuid not null default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    campaign_id uuid references public.campaigns(id) on delete cascade not null,
    display_name text null,
    data jsonb null default '{}'::jsonb,
    last_seen timestamptz null default now(),
    created_at timestamptz null default now(),
    constraint game_players_pkey primary key (id),
    constraint game_players_user_campaign_unique unique (user_id, campaign_id)
);

alter table public.game_players enable row level security;

DROP POLICY IF EXISTS "Users can view their own game data" ON public.game_players;
create policy "Users can view their own game data"
on public.game_players
for select
using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own game data" ON public.game_players;
create policy "Users can update their own game data"
on public.game_players
for update
using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own game data" ON public.game_players;
create policy "Users can insert their own game data"
on public.game_players
for insert
with check (auth.uid() = user_id);

-- =================================================================
-- START: 20251214000500_create_game_structures.sql
-- =================================================================

DROP TABLE IF EXISTS public.game_structures CASCADE;
create table public.game_structures (
    id uuid not null default gen_random_uuid(),
    campaign_id uuid references public.campaigns(id) on delete cascade not null,
    owner_id uuid references auth.users(id) on delete set null,
    type text not null,
    x float not null,
    y float not null,
    data jsonb null default '{}'::jsonb,
    created_at timestamptz null default now(),
    constraint game_structures_pkey primary key (id)
);

alter table public.game_structures enable row level security;

DROP POLICY IF EXISTS "Users can view all structures" ON public.game_structures;
create policy "Users can view all structures"
on public.game_structures
for select
using (true);

DROP POLICY IF EXISTS "Users can check insert structures" ON public.game_structures;
create policy "Users can check insert structures"
on public.game_structures
for insert
with check (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own structures" ON public.game_structures;
create policy "Users can delete own structures"
on public.game_structures
for delete
using (auth.uid() = owner_id);
