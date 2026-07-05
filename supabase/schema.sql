create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete set null,
  conditions jsonb not null,
  candidates jsonb not null default '[]'::jsonb,
  status text not null default 'waiting' check (status in ('waiting', 'voting', 'roulette', 'done')),
  vote_ends_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

alter table public.sessions add column if not exists vote_ends_at timestamp with time zone;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  joined_at timestamp with time zone not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  place_id text not null,
  created_at timestamp with time zone not null default now(),
  unique(session_id, member_id)
);

create table if not exists public.roulette_additions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  place_name text not null,
  place_id text,
  unique(session_id, member_id)
);

alter table public.sessions enable row level security;
alter table public.members enable row level security;
alter table public.votes enable row level security;
alter table public.roulette_additions enable row level security;

drop policy if exists "sessions read all" on public.sessions;
create policy "sessions read all" on public.sessions for select using (true);
drop policy if exists "sessions insert auth" on public.sessions;
create policy "sessions insert auth" on public.sessions
for insert with check (auth.uid() is not null);
drop policy if exists "sessions update all" on public.sessions;
create policy "sessions update all" on public.sessions
for update using (true) with check (true);

drop policy if exists "members read all" on public.members;
create policy "members read all" on public.members for select using (true);
drop policy if exists "members insert all" on public.members;
create policy "members insert all" on public.members for insert with check (true);

drop policy if exists "votes read all" on public.votes;
create policy "votes read all" on public.votes for select using (true);
drop policy if exists "votes upsert all" on public.votes;
create policy "votes upsert all" on public.votes for all using (true) with check (true);

drop policy if exists "roulette additions read all" on public.roulette_additions;
create policy "roulette additions read all" on public.roulette_additions for select using (true);
drop policy if exists "roulette additions upsert all" on public.roulette_additions;
create policy "roulette additions upsert all" on public.roulette_additions
for all using (true) with check (true);

-- Dashboard > Database > Replication で members / votes / roulette_additions の Realtime を有効化してください。
