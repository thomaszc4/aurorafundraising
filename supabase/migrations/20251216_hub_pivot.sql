-- AURORA RPG PIVOT MIGRATION
-- 1. Create Campaign State (Shared World)
create table if not exists campaign_state (
    campaign_id uuid primary key references campaigns(id),
    current_quest_index int default 0,
    unlocked_skills jsonb default '[]'::jsonb, -- Array of strings e.g. ["snowball", "climbing"]
    global_inventory jsonb default '[]'::jsonb, -- Array of InventoryItem
    quest_log jsonb default '[]'::jsonb, -- Array of { text, author, timestamp }
    total_raised numeric default 0,
    updated_at timestamp with time zone default now()
);

-- 2. Update Player Progress (Individual)
alter table game_players 
add column if not exists personal_skills jsonb default '[]'::jsonb,
add column if not exists contribution_score int default 0;

-- 3. Leaderboard View
create or replace view leaderboard as
select 
    id,
    campaign_id,
    display_name,
    contribution_score,
    (data->'appearance') as appearance
from game_players
order by contribution_score desc;

-- 4. Enable RLS
alter table campaign_state enable row level security;

-- Policy: Everyone in campaign can read
create policy "Read Campaign State" on campaign_state
    for select using (true); 

-- Policy: Everyone in campaign can update (Optimistic for now, ideally server-side)
create policy "Update Campaign State" on campaign_state
    for update using (true);
