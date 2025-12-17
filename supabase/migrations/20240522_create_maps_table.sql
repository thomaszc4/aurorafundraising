create table if not exists maps (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  name text not null default 'Untitled Map',
  data jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users not null
);

-- Enable RLS
alter table maps enable row level security;

-- Policies
create policy "Users can view their own maps"
  on maps for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own maps"
  on maps for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own maps"
  on maps for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own maps"
  on maps for delete
  using (auth.uid() = owner_id);
