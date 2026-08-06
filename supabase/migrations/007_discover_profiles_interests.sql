-- Discover profiles and interest taxonomy for later Supabase connection
alter table public.profiles
  add column if not exists city text,
  add column if not exists contact_mode text not null default 'online' check (contact_mode in ('online','studio','both')),
  add column if not exists discover_visible boolean not null default true,
  add column if not exists contact_open boolean not null default true,
  add column if not exists last_seen_at timestamptz;

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_de text not null,
  label_en text not null,
  is_sensitive boolean not null default false,
  is_active boolean not null default true
);

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  relation text not null check (relation in ('offers','seeks','limit')),
  visibility text not null default 'public' check (visibility in ('public','matches','private')),
  primary key (profile_id, interest_id, relation)
);

create index if not exists profiles_discover_idx on public.profiles(discover_visible, role, city);
create index if not exists profile_interests_relation_idx on public.profile_interests(interest_id, relation);

alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;

create policy "active interests are readable" on public.interests for select using (is_active);
create policy "public discover interests readable" on public.profile_interests for select using (
  visibility = 'public' or profile_id = auth.uid()
);
create policy "users manage own interests" on public.profile_interests for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

insert into public.interests (slug,label_de,label_en,is_sensitive) values
 ('online-orders','Online-Befehle','Online commands',false),
 ('chastity','Keuschhaltung','Chastity',true),
 ('financial-dominance','Finanzdominanz','Financial domination',true),
 ('money-slave','Zahlsklave','Money slave',true),
 ('foot-fetish','Fußfetisch','Foot fetish',true),
 ('tasks','Aufgaben','Tasks',false),
 ('rituals','Rituale','Rituals',false),
 ('journaling','Journaling','Journaling',false),
 ('studio-sessions','Studio-Sessions','Studio sessions',false),
 ('long-term-dynamic','Langzeitdynamik','Long-term dynamic',false)
on conflict (slug) do nothing;
