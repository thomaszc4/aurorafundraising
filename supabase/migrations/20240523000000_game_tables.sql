
-- Migration: Create Game Tables
-- Run with: npx supabase db push

-- DROP EXISTING TABLES TO ENSURE CLEAN SCHEMA (Dev Mode)
drop table if exists public.game_players cascade;
drop table if exists public.game_structures cascade;

-- 1. Game Players
create table public.game_players (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null,
  x float not null,
  y float not null,
  display_name text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen timestamptz default now(),
  
  constraint game_players_pkey primary key (id),
  constraint game_players_uniq unique (user_id, campaign_id)
);

alter table public.game_players enable row level security;
create policy "Enable all access for game_players" on public.game_players for all using (true);

-- 2. Game Structures
create table public.game_structures (
  id uuid not null default gen_random_uuid(),
  owner_id text null, 
  campaign_id uuid not null,
  type text not null, 
  x float not null,
  y float not null,
  data jsonb null,
  created_at timestamptz default now(),
  
  constraint game_structures_pkey primary key (id)
);

alter table public.game_structures enable row level security;
create policy "Enable all access for game_structures" on public.game_structures for all using (true);

-- Indexes
create index if not exists game_players_campaign_user_idx on public.game_players (campaign_id, user_id);
create index if not exists game_structures_campaign_idx on public.game_structures (campaign_id);
