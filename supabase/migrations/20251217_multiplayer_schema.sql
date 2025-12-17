-- 1. CAMPAIGN MILESTONES (The "Cliffs" & "Gates")
-- Stores the fundraising goals and their associated story unlocks
create table public.campaign_milestones (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) not null,
  unlock_threshold numeric not null, -- The $ amount (or % if handled via logic, but $ is safer)
  title text not null, -- e.g., "The Bridge"
  description text, -- Story text shown in Log
  is_unlocked boolean default false,
  unlocked_at timestamptz,
  
  unique(campaign_id, unlock_threshold)
);

-- 2. QUEST DEFINITIONS (Data-driven quests)
-- We might hardcode logic in TS, but tracking *available* quests in DB is good for dynamic updates
create table public.quest_definitions (
  id text primary key, -- e.g. 'q_arrival', 'q_build_shelter'
  title text not null,
  description text not null,
  required_level integer default 0,
  is_group_quest boolean default false, -- If true, progress is shared campaign-wide
  rewards jsonb default '{}'::jsonb -- { "tokens": 100, "item": "coat" }
);

-- 3. PLAYER QUEST PROGRESS
create table public.player_quests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.game_players(id) not null,
  quest_id text references public.quest_definitions(id) not null,
  status text default 'active' check (status in ('active', 'completed', 'failed')),
  progress jsonb default '{}'::jsonb, -- Store steps: { "wood_collected": 5 }
  completed_at timestamptz,
  
  unique(player_id, quest_id)
);

-- 4. SHARED INVENTORY / STORY LOG
-- For "Shared Inventory", we can just use a special "Storage" player or a specific table
-- Let's use a dedicated table for Group Stash
create table public.campaign_stash (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) not null,
  items jsonb default '[]'::jsonb, -- Array of InventoryItems
  updated_at timestamptz default now(),
  
  unique(campaign_id)
);

-- Story Log / Global Events
create table public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) not null,
  type text not null, -- 'milestone', 'quest_complete', 'chat'
  message text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 5. LEADERBOARD VIEW
-- Materialized view for performance if thousands of players, but for 500 standard view is fine
create or replace view public.view_leaderboard as
select 
  gp.id,
  gp.display_name,
  gp.campaign_id,
  gp.score,
  gp.tokens,
  gp.avatar_seed
from public.game_players gp
order by gp.score desc;

-- Enable Realtime
alter publication supabase_realtime add table public.campaign_milestones;
alter publication supabase_realtime add table public.campaign_events;
alter publication supabase_realtime add table public.campaign_stash;
-- player_quests usually private, but maybe useful for "friend" UI? Keep private for now to save bandwidth.

-- POLICIES
alter table public.campaign_milestones enable row level security;
create policy "Read milestones" on public.campaign_milestones for select using (true);

alter table public.quest_definitions enable row level security;
create policy "Read quests" on public.quest_definitions for select using (true);

alter table public.player_quests enable row level security;
create policy "Own quests" on public.player_quests for all using (
  player_id in (select id from public.game_players where student_fundraiser_id in (select id from public.student_fundraisers where student_id = auth.uid()))
);

alter table public.campaign_events enable row level security;
create policy "Read events" on public.campaign_events for select using (true);
create policy "Write events system" on public.campaign_events for insert with check (auth.role() = 'authenticated'); -- Logic should validate
