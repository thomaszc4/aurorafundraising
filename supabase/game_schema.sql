-- Create Game Players Table
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) not null,
  student_fundraiser_id uuid references public.student_fundraisers(id) not null,
  display_name text not null,
  avatar_seed text, -- For unique character looks
  tokens integer default 0,
  x integer default 400, -- Starting X position
  y integer default 300, -- Starting Y position
  score integer default 0,
  inventory jsonb default '{}'::jsonb,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  
  constraint unique_student_game unique (student_fundraiser_id)
);

-- Create Game Objects Table (Igloos, items placed on map)
create table public.game_objects (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) not null,
  owner_id uuid references public.game_players(id),
  type text not null, -- 'igloo', 'quickstove', etc
  x integer not null,
  y integer not null,
  data jsonb default '{}'::jsonb, -- color, level, etc
  created_at timestamptz default now()
);

-- Enable Realtime for these tables
alter publication supabase_realtime add table public.game_players;
alter publication supabase_realtime add table public.game_objects;

-- RLS Policies (Simplified for development - refine for production)
alter table public.game_players enable row level security;
alter table public.game_objects enable row level security;

-- Allow reading all players in same campaign
create policy "View players in same campaign"
  on public.game_players for select
  using (
    campaign_id in (
      select campaign_id from public.student_fundraisers
      where id = auth.uid() -- This might need adjusting based on how auth perms work in your app
      -- For MVP: Allow authenticated users to read all game_players
    )
    or auth.role() = 'authenticated' -- MVP simplification
  );

-- Allow updating own player
create policy "Update own player"
  on public.game_players for update
  using (
    student_fundraiser_id in (
      select id from public.student_fundraisers where student_id = auth.uid()
    )
  );

create policy "Insert own player"
  on public.game_players for insert
  with check (true); -- controlled by application logic mostly

-- Allow reading all objects
create policy "View all objects"
  on public.game_objects for select
  using (auth.role() = 'authenticated');

-- Allow building objects
create policy "Create objects"
  on public.game_objects for insert
  with check (auth.role() = 'authenticated');
