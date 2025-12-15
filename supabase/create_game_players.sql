
-- Create game_players table if it doesn't exist
create table if not exists public.game_players (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null, -- or text if using custom IDs
  campaign_id uuid not null,
  x float not null,
  y float not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint game_players_pkey primary key (id),
  constraint game_players_uniq unique (user_id, campaign_id)
);

-- Enable RLS
alter table public.game_players enable row level security;

-- Policies (Open for now for testing, restrict later)
create policy "Enable read access for all users" on public.game_players for select using (true);
create policy "Enable insert for authenticated users" on public.game_players for insert with check (true);
create policy "Enable update for users based on user_id" on public.game_players for update using (true);

-- Indexes
create index if not exists game_players_campaign_id_idx on public.game_players (campaign_id);
