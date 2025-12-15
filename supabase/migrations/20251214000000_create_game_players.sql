create table if not exists public.game_players (
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

create policy "Users can view their own game data"
on public.game_players
for select
using (auth.uid() = user_id);

create policy "Users can update their own game data"
on public.game_players
for update
using (auth.uid() = user_id);

create policy "Users can insert their own game data"
on public.game_players
for insert
with check (auth.uid() = user_id);
