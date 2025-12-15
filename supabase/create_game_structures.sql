
-- Create game_structures table if it doesn't exist
create table if not exists public.game_structures (
  id uuid not null default gen_random_uuid(),
  owner_id text null, -- Changed to text to support custom IDs like 'debug-...'
  campaign_id uuid not null,
  type text not null, 
  x float not null,
  y float not null,
  data jsonb null,
  created_at timestamptz default now(),
  
  constraint game_structures_pkey primary key (id)
);

-- Enable RLS
alter table public.game_structures enable row level security;

-- Policies (Open for now)
create policy "Enable read access for all users" on public.game_structures for select using (true);
create policy "Enable insert for authenticated users" on public.game_structures for insert with check (true);
create policy "Enable update for users" on public.game_structures for update using (true);

-- Indexes
create index if not exists game_structures_campaign_id_idx on public.game_structures (campaign_id);
