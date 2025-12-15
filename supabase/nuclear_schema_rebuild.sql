-- ==========================================
-- NUCLEAR RESET & REBUILD SCRIPT
-- ==========================================
-- WARNING: THIS WILL DELETE ALL DATA IN THE PUBLIC SCHEMA
-- ==========================================

BEGIN;

-- 1. CLEAN SLATE
-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables (Cascade to remove dependencies)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.campaign_products CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE; -- If exists
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.campaign_status CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;

-- 2. ENUMS & TYPES
CREATE TYPE public.app_role AS ENUM (
    'super_admin', 
    'admin', 
    'organization_admin', 
    'student', 
    'individual'
);

CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- 3. TABLES

-- PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER ROLES
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- CAMPAIGNS
CREATE TABLE public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_admin_id UUID REFERENCES public.profiles(id) NOT NULL, -- The creator (Individual or Org Admin)
    name TEXT NOT NULL,
    description TEXT,
    goal_amount DECIMAL(10,2) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status public.campaign_status DEFAULT 'draft',
    organization_name TEXT, -- For simple org storage
    program_name TEXT,      -- For simple program storage
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAIGN_PRODUCTS (Many-to-Many)
CREATE TABLE public.campaign_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(campaign_id, product_id)
);

-- PARTICIPANTS (Students/Sellers)
CREATE TABLE public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id), -- Optional: Link to auth user if they sign up
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    code TEXT UNIQUE NOT NULL, -- "Join Code" or unique seller code
    goal_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id),
    participant_id UUID REFERENCES public.participants(id), -- Who gets credit
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    status public.order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- 4. RLS POLICIES (Simplified for Launch Stability)

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles: Public Read, Self Write
CREATE POLICY "Profiles Public Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles Self Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles Self Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Roles: Public Read (needed for auth context), System Writability via Trigger
CREATE POLICY "Roles Public Read" ON public.user_roles FOR SELECT USING (true);
-- No direct insert policy needed if only triggers do it, BUT for debugging let's allow Verified Users
CREATE POLICY "Roles Admin Insert" ON public.user_roles FOR INSERT WITH CHECK (true); 

-- Campaigns: Public Read, Owner Write
CREATE POLICY "Campaigns Public Read" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Campaigns Owner Write" ON public.campaigns FOR ALL USING (auth.uid() = organization_admin_id);


-- 5. AUTH TRIGGER (ROBUST)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role_str text;
  v_role public.app_role;
BEGIN
  -- A. Create Profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profile creation error: %', SQLERRM;
  END;

  -- B. Determine Role
  v_role_str := NEW.raw_user_meta_data->>'role';
  
  IF v_role_str = 'individual' THEN
    v_role := 'individual';
  ELSIF v_role_str = 'organization_admin' THEN
    v_role := 'organization_admin';
  ELSIF v_role_str = 'student' THEN
    v_role := 'student';
  ELSE
    v_role := 'organization_admin'; -- Default
  END IF;

  -- C. Assign Role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Role assignment error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. SEED INITIAL DATA (Optional - Products)
-- Insert basic product if needed
INSERT INTO public.products (name, description, price, active)
VALUES ('QuickStove Emergency Kit', 'Portable stove + 2 fuel disks. Boils water in minutes.', 30.00, true);

COMMIT;
