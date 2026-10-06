create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  interests text[] default '{}',
  level text default 'Beginner',
  xp integer default 0,
  streak integer default 0,
  last_active date,
  is_pro boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.lessons (
  id text primary key,
  category text not null,
  title text not null,
  subtitle text,
  tag text,
  difficulty text default 'Beginner',
  scenes jsonb not null,
  tags text[] default '{}',
  published boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.user_lessons (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete cascade,
  completed boolean default false,
  liked boolean default false,
  saved boolean default false,
  progress integer default 0,
  completed_at timestamptz,
  primary key(user_id, lesson_id)
);

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.user_lessons enable row level security;

create policy "published lessons readable" on public.lessons
  for select using (published = true);

create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

create policy "own lesson progress" on public.user_lessons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
