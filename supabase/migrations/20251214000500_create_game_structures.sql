create table if not exists public.game_structures (
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

create policy "Users can view all structures"
on public.game_structures
for select
using (true);

create policy "Users can check insert structures"
on public.game_structures
for insert
with check (auth.uid() = owner_id);

create policy "Users can delete own structures"
on public.game_structures
for delete
using (auth.uid() = owner_id);
