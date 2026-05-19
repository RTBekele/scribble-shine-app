-- ============================================================
--  Scribble & Shine — Supabase schema
--  Run this in the Supabase SQL editor after creating a project.
-- ============================================================

-- 1. Profiles ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);
create policy "Profiles are insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles are updatable by owner"
  on public.profiles for update using (auth.uid() = id);

-- 2. Saved stories -------------------------------------------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  title text not null,
  language text,
  age_range text,
  pages jsonb not null,        -- [{ page, text, illustrationPrompt }]
  images jsonb,                -- { "<page>": "<storage path>" }
  created_at timestamptz default now()
);

alter table public.stories enable row level security;

create policy "Stories: select own"
  on public.stories for select using (auth.uid() = owner);
create policy "Stories: insert own"
  on public.stories for insert with check (auth.uid() = owner);
create policy "Stories: update own"
  on public.stories for update using (auth.uid() = owner);
create policy "Stories: delete own"
  on public.stories for delete using (auth.uid() = owner);

-- 3. Saved drawings ------------------------------------------
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  title text,
  image_path text not null,    -- path inside the 'creations' bucket
  created_at timestamptz default now()
);

alter table public.drawings enable row level security;

create policy "Drawings: select own"
  on public.drawings for select using (auth.uid() = owner);
create policy "Drawings: insert own"
  on public.drawings for insert with check (auth.uid() = owner);
create policy "Drawings: delete own"
  on public.drawings for delete using (auth.uid() = owner);

-- 4. Storage bucket ------------------------------------------
-- Create a bucket called 'creations' in the Supabase dashboard,
-- or run:
--   insert into storage.buckets (id, name, public) values ('creations','creations', false);
--
-- Then add a policy: users can read/write only their own folder
-- (objects must be stored at "<auth.uid()>/...")
--
-- create policy "Creations: owner read"
--   on storage.objects for select
--   using (bucket_id = 'creations' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "Creations: owner write"
--   on storage.objects for insert
--   with check (bucket_id = 'creations' and (storage.foldername(name))[1] = auth.uid()::text);
