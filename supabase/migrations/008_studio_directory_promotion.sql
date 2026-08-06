-- Studio directory and session linking foundation
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  slug text not null unique,
  name text not null,
  city text not null,
  region text,
  intro text not null default '',
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  is_rentable boolean not null default false,
  is_discreet boolean not null default true,
  is_accessible boolean not null default false,
  transit_info text not null default '',
  access_note text not null default '',
  amenities text[] not null default array[]::text[],
  session_types text[] not null default array[]::text[],
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_availability (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'available' check (status in ('available','held','booked','blocked')),
  note text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.sessions
  add column if not exists studio_id uuid references public.studios(id) on delete set null;

create index if not exists studios_city_public_idx on public.studios(city, is_public);
create index if not exists studio_availability_studio_time_idx on public.studio_availability(studio_id, starts_at);
create index if not exists sessions_studio_idx on public.sessions(studio_id);

alter table public.studios enable row level security;
alter table public.studio_availability enable row level security;

create policy "public studios readable" on public.studios for select using (is_public or owner_id = auth.uid());
create policy "studio owner manages profile" on public.studios for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "public availability readable" on public.studio_availability for select using (
  exists(select 1 from public.studios s where s.id = studio_id and s.is_public)
);
create policy "studio owner manages availability" on public.studio_availability for all to authenticated using (
  exists(select 1 from public.studios s where s.id = studio_id and s.owner_id = auth.uid())
) with check (
  exists(select 1 from public.studios s where s.id = studio_id and s.owner_id = auth.uid())
);
