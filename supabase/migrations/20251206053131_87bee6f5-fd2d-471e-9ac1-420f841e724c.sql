-- Phase 1: Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'campaign_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'participant';