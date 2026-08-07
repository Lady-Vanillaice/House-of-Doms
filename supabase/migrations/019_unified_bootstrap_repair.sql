-- House of Doms — unified Supabase bootstrap / repair
-- Consolidates the effective schema from migrations 001–018.
-- Safe to run on a fresh project or a partially initialized project.
-- Existing user data is preserved; objects are repaired in place where possible.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- ENUMS (create if missing, extend if needed)
-- -----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='user_role') then
    create type public.user_role as enum ('dom','domina','sub','sklave');
  end if;
end $$;
alter type public.user_role add value if not exists 'dom';
alter type public.user_role add value if not exists 'domina';
alter type public.user_role add value if not exists 'sub';
alter type public.user_role add value if not exists 'sklave';

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='relationship_style') then
    create type public.relationship_style as enum ('exclusive','private_circle','community');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='application_status') then
    create type public.application_status as enum ('pending','accepted','rejected','waitlist','withdrawn');
  end if;
end $$;
alter type public.application_status add value if not exists 'waitlist';

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='task_status') then
    create type public.task_status as enum ('open','submitted','approved','rejected','cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='order_status') then
    create type public.order_status as enum ('pending','paid','refunded','cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='store_product_type') then
    create type public.store_product_type as enum ('digital','package','session');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='store_product_status') then
    create type public.store_product_status as enum ('draft','published','archived');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='store_visibility') then
    create type public.store_visibility as enum ('public','members','house');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='store_order_status') then
    create type public.store_order_status as enum ('pending','paid','cancelled','refunded');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- CORE PROFILES / HOUSES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Neues Mitglied',
  role public.user_role not null default 'sub',
  bio text not null default '',
  locale text not null default 'de',
  is_adult_confirmed boolean not null default false,
  is_verified boolean not null default false,
  city text,
  contact_mode text not null default 'online',
  discover_visible boolean not null default true,
  contact_open boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role public.user_role;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists locale text not null default 'de';
alter table public.profiles add column if not exists is_adult_confirmed boolean not null default false;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists contact_mode text not null default 'online';
alter table public.profiles add column if not exists discover_visible boolean not null default true;
alter table public.profiles add column if not exists contact_open boolean not null default true;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  welcome_message text not null default '',
  rules_text text,
  relationship_style public.relationship_style not null default 'exclusive',
  applications_open boolean not null default true,
  is_public boolean not null default true,
  visibility text not null default 'private',
  door_theme text not null default 'obsidian',
  created_at timestamptz not null default now(),
  unique(owner_id)
);
alter table public.houses add column if not exists welcome_message text not null default '';
alter table public.houses add column if not exists rules_text text;
alter table public.houses add column if not exists relationship_style public.relationship_style not null default 'exclusive';
alter table public.houses add column if not exists applications_open boolean not null default true;
alter table public.houses add column if not exists is_public boolean not null default true;
alter table public.houses add column if not exists visibility text not null default 'private';
alter table public.houses add column if not exists door_theme text not null default 'obsidian';

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  subject text,
  experience text,
  availability text,
  boundaries text,
  status public.application_status not null default 'pending',
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  unique(house_id, applicant_id)
);
alter table public.applications add column if not exists subject text;
alter table public.applications add column if not exists experience text;
alter table public.applications add column if not exists availability text;
alter table public.applications add column if not exists boundaries text;
alter table public.applications add column if not exists decision_note text;
alter table public.applications add column if not exists updated_at timestamptz not null default now();
alter table public.applications add column if not exists decided_at timestamptz;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  house_key text not null unique,
  title text not null default 'Mitglied',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(house_id, member_id)
);

-- -----------------------------------------------------------------------------
-- TASKS / JOURNAL / EVIDENCE
-- -----------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  assigned_to uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  status public.task_status not null default 'open',
  points integer not null default 0,
  due_at timestamptz,
  submitted_text text,
  required_proof_types text[] not null default array[]::text[],
  release_at timestamptz not null default now(),
  calendar_teaser text not null default '1 Aufgabe geplant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks add column if not exists required_proof_types text[] not null default array[]::text[];
alter table public.tasks add column if not exists release_at timestamptz not null default now();
alter table public.tasks add column if not exists calendar_teaser text not null default '1 Aufgabe geplant';

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  text_content text,
  status text not null default 'submitted',
  reviewer_feedback text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions(id) on delete cascade,
  storage_path text not null,
  media_type text not null,
  original_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete cascade,
  title text,
  content text not null,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace view public.task_calendar_feed with (security_invoker=true) as
select id, house_id, assigned_to, release_at, due_at,
  case when release_at <= now() then title else calendar_teaser end as display_title,
  case when release_at <= now() then status::text else 'planned' end as display_status,
  (release_at <= now()) as is_released
from public.tasks;

-- -----------------------------------------------------------------------------
-- MESSAGING: preserve legacy direct messages AND support private chamber threads
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid not null,
  last_read_at timestamptz,
  is_blocked boolean default false,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  body text,
  created_at timestamptz default now()
);

alter table public.messages add column if not exists house_id uuid references public.houses(id) on delete cascade;
alter table public.messages add column if not exists recipient_id uuid references public.profiles(id) on delete cascade;
alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists linked_task_id uuid;
alter table public.messages add column if not exists linked_tribute_id uuid;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages alter column body drop not null;
alter table public.messages alter column house_id drop not null;
alter table public.messages alter column recipient_id drop not null;

create table if not exists public.profile_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text,
  bio text,
  location text,
  languages text[] default '{}',
  offers text[] default '{}',
  seeks text[] default '{}',
  boundaries text[] default '{}',
  contact_status text default 'open',
  studio_info text,
  is_verified boolean default false,
  visibility text default 'public',
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- CALENDAR / STUDIO WINDOWS / BOOKINGS
-- -----------------------------------------------------------------------------
create table if not exists public.studio_days (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null,
  starts_at time not null,
  ends_at time not null,
  studio_name text not null,
  studio_address text,
  description text,
  slot_length_minutes integer not null default 60,
  break_minutes integer not null default 0,
  price_cents integer,
  currency text not null default 'EUR',
  is_public boolean not null default true,
  booking_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_slots (
  id uuid primary key default gen_random_uuid(),
  studio_day_id uuid not null references public.studio_days(id) on delete cascade,
  starts_at time not null,
  ends_at time not null,
  is_available boolean not null default true,
  capacity integer not null default 1,
  created_at timestamptz not null default now(),
  unique(studio_day_id, starts_at, ends_at)
);

create table if not exists public.slot_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references public.studio_slots(id) on delete cascade,
  studio_day_id uuid references public.studio_days(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  starts_at time,
  ends_at time,
  status text not null default 'requested',
  note text,
  dom_note text,
  price_cents integer,
  currency text not null default 'EUR',
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);
alter table public.slot_bookings add column if not exists studio_day_id uuid references public.studio_days(id) on delete cascade;
alter table public.slot_bookings add column if not exists starts_at time;
alter table public.slot_bookings add column if not exists ends_at time;
alter table public.slot_bookings alter column slot_id drop not null;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  event_date date not null,
  starts_at time,
  ends_at time,
  task_id uuid references public.tasks(id) on delete cascade,
  studio_day_id uuid references public.studio_days(id) on delete cascade,
  booking_id uuid references public.slot_bookings(id) on delete cascade,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- SESSIONS / NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  dom_id uuid not null references public.profiles(id) on delete cascade,
  sub_id uuid not null references public.profiles(id) on delete cascade,
  studio_day_id uuid references public.studio_days(id) on delete set null,
  booking_id uuid references public.slot_bookings(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  studio_name text not null default '',
  status text not null default 'requested',
  booking_note text not null default '',
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sessions add column if not exists studio_day_id uuid references public.studio_days(id) on delete set null;
alter table public.sessions add column if not exists booking_id uuid references public.slot_bookings(id) on delete set null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- DISCOVER
-- -----------------------------------------------------------------------------
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
  relation text not null,
  visibility text not null default 'public',
  primary key(profile_id, interest_id, relation)
);

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
on conflict(slug) do nothing;

-- -----------------------------------------------------------------------------
-- STUDIO DIRECTORY
-- -----------------------------------------------------------------------------
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
  status text not null default 'available',
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.sessions add column if not exists studio_id uuid references public.studios(id) on delete set null;

-- -----------------------------------------------------------------------------
-- STORE / ORDERS
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  seller_id uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  amount_cents integer not null,
  platform_fee_cents integer not null default 0,
  status public.order_status not null default 'pending',
  payment_provider_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  product_type public.store_product_type not null default 'digital',
  status public.store_product_status not null default 'draft',
  visibility public.store_visibility not null default 'public',
  featured boolean not null default false,
  delivery_note text,
  session_required boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  amount_cents integer not null,
  currency text not null default 'EUR',
  status public.store_order_status not null default 'pending',
  provider_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.store_access_grants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.store_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- -----------------------------------------------------------------------------
-- FINANCIAL DYNAMICS / TRIBUTE
-- -----------------------------------------------------------------------------
create table if not exists public.financial_dynamics (
  id uuid primary key default gen_random_uuid(),
  dom_id uuid not null references public.profiles(id) on delete cascade,
  sub_id uuid not null references public.profiles(id) on delete cascade,
  monthly_limit_cents integer not null default 0,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dom_id, sub_id)
);

create table if not exists public.tribute_requests (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.financial_dynamics(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null,
  note text,
  status text not null default 'requested',
  payment_provider_ref text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  paid_at timestamptz
);

-- -----------------------------------------------------------------------------
-- LEGACY SUPPORT TABLES
-- -----------------------------------------------------------------------------
create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
create index if not exists houses_owner_idx on public.houses(owner_id);
create index if not exists applications_house_status_idx on public.applications(house_id,status);
create index if not exists memberships_member_idx on public.memberships(member_id,ended_at);
create index if not exists tasks_assigned_status_idx on public.tasks(assigned_to,status);
create index if not exists tasks_release_at_idx on public.tasks(assigned_to,release_at);
create index if not exists messages_recipient_idx on public.messages(recipient_id,created_at desc);
create index if not exists messages_conversation_idx on public.messages(conversation_id,created_at desc);
create index if not exists studio_days_house_date_idx on public.studio_days(house_id,event_date);
create index if not exists studio_slots_day_idx on public.studio_slots(studio_day_id,starts_at);
create index if not exists slot_bookings_requester_idx on public.slot_bookings(requester_id,status);
create index if not exists slot_bookings_studio_day_time_idx on public.slot_bookings(studio_day_id,starts_at,ends_at);
create index if not exists calendar_events_house_date_idx on public.calendar_events(house_id,event_date);
create index if not exists sessions_dom_start_idx on public.sessions(dom_id,starts_at desc);
create index if not exists sessions_sub_start_idx on public.sessions(sub_id,starts_at desc);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id,created_at desc);
create index if not exists profiles_discover_idx on public.profiles(discover_visible,role,city);
create index if not exists studios_city_public_idx on public.studios(city,is_public);

-- -----------------------------------------------------------------------------
-- AUTH MIRROR / BACKFILL
-- -----------------------------------------------------------------------------
insert into public.profiles(id,display_name,role,is_adult_confirmed)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'display_name',''),nullif(u.raw_user_meta_data->>'name',''),split_part(coalesce(u.email,''),'@',1),'Neues Mitglied'),
  case lower(coalesce(u.raw_user_meta_data->>'role','sub'))
    when 'dom' then 'dom'::public.user_role
    when 'domina' then 'domina'::public.user_role
    when 'sklave' then 'sklave'::public.user_role
    else 'sub'::public.user_role
  end,
  coalesce((u.raw_user_meta_data->>'is_adult_confirmed')::boolean,true)
from auth.users u
on conflict(id) do update set
  display_name=coalesce(nullif(public.profiles.display_name,''),excluded.display_name),
  role=excluded.role,
  updated_at=now();

insert into public.profile_details(user_id,display_name,role,boundaries,languages,contact_status,visibility)
select u.id,
  coalesce(nullif(u.raw_user_meta_data->>'display_name',''),split_part(coalesce(u.email,''),'@',1)),
  coalesce(u.raw_user_meta_data->>'role','sub'),
  array['Jederzeit widerrufbar']::text[],array['DE']::text[],'open','public'
from auth.users u
on conflict(user_id) do nothing;

insert into public.houses(owner_id,name,welcome_message,relationship_style,applications_open,is_public)
select p.id,coalesce(nullif(p.display_name,''),'House') || ' · House','', 'private_circle',true,true
from public.profiles p
where p.role in ('dom','domina')
and not exists(select 1 from public.houses h where h.owner_id=p.id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,display_name,role,is_adult_confirmed)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''),nullif(new.raw_user_meta_data->>'name',''),split_part(coalesce(new.email,''),'@',1),'Neues Mitglied'),
    case lower(coalesce(new.raw_user_meta_data->>'role','sub'))
      when 'dom' then 'dom'::public.user_role
      when 'domina' then 'domina'::public.user_role
      when 'sklave' then 'sklave'::public.user_role
      else 'sub'::public.user_role
    end,
    coalesce((new.raw_user_meta_data->>'is_adult_confirmed')::boolean,true)
  ) on conflict(id) do nothing;
  insert into public.profile_details(user_id,display_name,role,boundaries,languages,contact_status,visibility)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),coalesce(new.raw_user_meta_data->>'role','sub'),array['Jederzeit widerrufbar']::text[],array['DE']::text[],'open','public')
  on conflict(user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
drop trigger if exists on_auth_user_created_profile on auth.users;

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
create or replace function public.is_dom_user(user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=user_id and p.role in ('dom','domina'));
$$;

create or replace function public.is_sub_user(user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=user_id and p.role in ('sub','sklave'));
$$;

create or replace function public.accept_application(application_id uuid, note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare app public.applications%rowtype;
begin
  select * into app from public.applications where id=application_id for update;
  if app.id is null then raise exception 'Application not found'; end if;
  if not exists(select 1 from public.houses h where h.id=app.house_id and h.owner_id=auth.uid()) then raise exception 'Only the House owner may accept this application'; end if;
  if not public.is_dom_user(auth.uid()) then raise exception 'Dom role required'; end if;
  update public.applications set status='accepted',decision_note=note,decided_at=now(),updated_at=now() where id=application_id;
  insert into public.memberships(house_id,member_id,house_key,title)
  values(app.house_id,app.applicant_id,'HOD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),'Mitglied')
  on conflict(house_id,member_id) do update set ended_at=null;
end; $$;

grant execute on function public.accept_application(uuid,text) to authenticated;

create or replace function public.generate_studio_slots(day_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare studio public.studio_days; cursor_time time; slot_end time;
begin
  select * into studio from public.studio_days where id=day_id;
  if studio.id is null then raise exception 'studio day not found'; end if;
  if studio.creator_id<>auth.uid() then raise exception 'not allowed'; end if;
  delete from public.studio_slots where studio_day_id=day_id;
  cursor_time:=studio.starts_at;
  loop
    slot_end:=cursor_time + make_interval(mins=>studio.slot_length_minutes);
    exit when slot_end>studio.ends_at;
    insert into public.studio_slots(studio_day_id,starts_at,ends_at) values(day_id,cursor_time,slot_end) on conflict do nothing;
    cursor_time:=slot_end + make_interval(mins=>studio.break_minutes);
  end loop;
end; $$;

create or replace function public.request_studio_booking(p_studio_day_id uuid,p_starts_at time,p_ends_at time,p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_day public.studio_days; v_booking_id uuid; v_price integer; v_minutes numeric;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  select * into v_day from public.studio_days where id=p_studio_day_id;
  if v_day.id is null then raise exception 'Studio-Tag nicht gefunden.'; end if;
  if not v_day.booking_enabled then raise exception 'Buchungen sind fuer dieses Zeitfenster deaktiviert.'; end if;
  if p_ends_at<=p_starts_at then raise exception 'Die Endzeit muss nach der Startzeit liegen.'; end if;
  if p_starts_at<v_day.starts_at or p_ends_at>v_day.ends_at then raise exception 'Die Session muss vollstaendig innerhalb des angebotenen Zeitfensters liegen.'; end if;
  if not (v_day.is_public or exists(select 1 from public.memberships m where m.house_id=v_day.house_id and m.member_id=auth.uid() and m.ended_at is null)) then raise exception 'Du darfst dieses Zeitfenster nicht buchen.'; end if;
  if exists(select 1 from public.slot_bookings b where b.studio_day_id=p_studio_day_id and b.status in ('requested','confirmed') and p_starts_at<b.ends_at and p_ends_at>b.starts_at) then raise exception 'Dieser Zeitraum ueberschneidet sich bereits mit einer anderen Buchung.'; end if;
  v_price:=null;
  if v_day.price_cents is not null then v_minutes:=extract(epoch from (p_ends_at-p_starts_at))/60.0; v_price:=round(v_day.price_cents*v_minutes/60.0); end if;
  insert into public.slot_bookings(slot_id,studio_day_id,house_id,requester_id,status,note,starts_at,ends_at,price_cents,currency)
  values(null,p_studio_day_id,v_day.house_id,auth.uid(),'requested',nullif(trim(coalesce(p_note,'')),''),p_starts_at,p_ends_at,v_price,v_day.currency)
  returning id into v_booking_id;
  return v_booking_id;
end; $$;
grant execute on function public.request_studio_booking(uuid,time,time,text) to authenticated;

create or replace function public.publish_studio_window(p_event_date date,p_starts_at time,p_ends_at time,p_studio_name text,p_price_cents integer default null)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_uid uuid:=auth.uid(); v_role text; v_name text; v_house_id uuid; v_day_id uuid;
begin
  if v_uid is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if p_event_date is null then raise exception 'Bitte ein Datum angeben.'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'Die Endzeit muss nach der Startzeit liegen.'; end if;
  if nullif(trim(coalesce(p_studio_name,'')),'') is null then raise exception 'Bitte Studio oder Ort angeben.'; end if;
  select lower(coalesce(u.raw_user_meta_data->>'role',p.role::text,'')),coalesce(nullif(p.display_name,''),nullif(u.raw_user_meta_data->>'display_name',''),split_part(coalesce(u.email,''),'@',1),'House')
  into v_role,v_name from auth.users u left join public.profiles p on p.id=u.id where u.id=v_uid;
  if v_role not in ('dom','domina') then raise exception 'Nur Dom/Domina kann Studio-Zeitfenster veroeffentlichen.'; end if;
  insert into public.profiles(id,display_name,role,is_adult_confirmed) values(v_uid,v_name,case when v_role='domina' then 'domina'::public.user_role else 'dom'::public.user_role end,true)
  on conflict(id) do update set role=excluded.role,updated_at=now();
  select id into v_house_id from public.houses where owner_id=v_uid limit 1;
  if v_house_id is null then insert into public.houses(owner_id,name,welcome_message,relationship_style,applications_open,is_public) values(v_uid,v_name||' · House','','private_circle',true,true) returning id into v_house_id; end if;
  insert into public.studio_days(house_id,creator_id,event_date,starts_at,ends_at,studio_name,slot_length_minutes,break_minutes,price_cents,currency,is_public,booking_enabled)
  values(v_house_id,v_uid,p_event_date,p_starts_at,p_ends_at,trim(p_studio_name),60,0,p_price_cents,'EUR',true,true) returning id into v_day_id;
  return v_day_id;
end; $$;
revoke all on function public.publish_studio_window(date,time,time,text,integer) from public;
grant execute on function public.publish_studio_window(date,time,time,text,integer) to authenticated;

create or replace function public.get_visible_studio_windows()
returns table(id uuid,house_id uuid,event_date date,starts_at time,ends_at time,studio_name text,price_cents integer)
language sql security definer set search_path=public stable as $$
  select sd.id,sd.house_id,sd.event_date,sd.starts_at,sd.ends_at,sd.studio_name,sd.price_cents
  from public.studio_days sd
  where auth.uid() is not null and (sd.creator_id=auth.uid() or sd.is_public=true or exists(select 1 from public.memberships m where m.house_id=sd.house_id and m.member_id=auth.uid() and m.ended_at is null))
  order by sd.event_date,sd.starts_at;
$$;
grant execute on function public.get_visible_studio_windows() to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname='public' and tablename in (
    'profiles','houses','applications','memberships','tasks','task_submissions','task_submission_files','journal_entries','profile_details','conversations','conversation_members','messages','studio_days','studio_slots','slot_bookings','calendar_events','sessions','notifications','interests','profile_interests','studios','studio_availability','products','orders','store_products','store_orders','store_access_grants','financial_dynamics','tribute_requests','agreements','reports'
  ) loop execute format('alter table public.%I enable row level security',r.tablename); end loop;
end $$;

-- Drop/recreate the policies used by the current app. Extra legacy policies may remain harmlessly.
drop policy if exists "Profile sind öffentlich lesbar" on public.profiles;
create policy "Profile sind öffentlich lesbar" on public.profiles for select using (true);
drop policy if exists "Eigenes Profil anlegen" on public.profiles;
create policy "Eigenes Profil anlegen" on public.profiles for insert to authenticated with check(auth.uid()=id);
drop policy if exists "Eigenes Profil bearbeiten" on public.profiles;
create policy "Eigenes Profil bearbeiten" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);

drop policy if exists "Öffentliche Houses lesen" on public.houses;
create policy "Öffentliche Houses lesen" on public.houses for select using(is_public or owner_id=auth.uid());
drop policy if exists "Eigenes House anlegen" on public.houses;
create policy "Eigenes House anlegen" on public.houses for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists "Eigenes House bearbeiten" on public.houses;
create policy "Eigenes House bearbeiten" on public.houses for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "Applicants and owners read applications" on public.applications;
drop policy if exists "Applicants create applications" on public.applications;
drop policy if exists "Applicants update applications" on public.applications;
drop policy if exists "Subs create own applications" on public.applications;
create policy "Subs create own applications" on public.applications for insert to authenticated with check(applicant_id=auth.uid() and public.is_sub_user(auth.uid()) and status='pending');
drop policy if exists "Applicants and owners read applications unified" on public.applications;
create policy "Applicants and owners read applications unified" on public.applications for select to authenticated using(applicant_id=auth.uid() or exists(select 1 from public.houses h where h.id=applications.house_id and h.owner_id=auth.uid()));

drop policy if exists "dom reads created tasks" on public.tasks;
create policy "dom reads created tasks" on public.tasks for select to authenticated using(created_by=auth.uid());
drop policy if exists "sub reads released tasks" on public.tasks;
create policy "sub reads released tasks" on public.tasks for select to authenticated using(assigned_to=auth.uid() and release_at<=now());
drop policy if exists "Doms create House tasks" on public.tasks;
create policy "Doms create House tasks" on public.tasks for insert to authenticated with check(created_by=auth.uid() and public.is_dom_user(auth.uid()) and exists(select 1 from public.houses h where h.id=tasks.house_id and h.owner_id=auth.uid()));
drop policy if exists "Assigned subs submit tasks" on public.tasks;
create policy "Assigned subs submit tasks" on public.tasks for update to authenticated using(assigned_to=auth.uid() and public.is_sub_user(auth.uid())) with check(assigned_to=auth.uid());

drop policy if exists "Public profiles are readable" on public.profile_details;
create policy "Public profiles are readable" on public.profile_details for select using(visibility='public' or auth.uid()=user_id);
drop policy if exists "Users can update own profile" on public.profile_details;
create policy "Users can update own profile" on public.profile_details for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

drop policy if exists "house members can view studio days" on public.studio_days;
create policy "house members can view studio days" on public.studio_days for select using(is_public=true or creator_id=auth.uid() or exists(select 1 from public.memberships m where m.house_id=studio_days.house_id and m.member_id=auth.uid() and m.ended_at is null));
drop policy if exists "doms publish studio days" on public.studio_days;
create policy "doms publish studio days" on public.studio_days for insert to authenticated with check(creator_id=auth.uid() and public.is_dom_user(auth.uid()) and exists(select 1 from public.houses h where h.id=studio_days.house_id and h.owner_id=auth.uid()));
drop policy if exists "doms update studio days" on public.studio_days;
create policy "doms update studio days" on public.studio_days for update to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid());
drop policy if exists "doms delete studio days" on public.studio_days;
create policy "doms delete studio days" on public.studio_days for delete to authenticated using(creator_id=auth.uid());

drop policy if exists "requesters and house owners view bookings" on public.slot_bookings;
create policy "requesters and house owners view bookings" on public.slot_bookings for select to authenticated using(requester_id=auth.uid() or exists(select 1 from public.houses h where h.id=slot_bookings.house_id and h.owner_id=auth.uid()));

drop policy if exists "session participants read" on public.sessions;
create policy "session participants read" on public.sessions for select to authenticated using(dom_id=auth.uid() or sub_id=auth.uid());
drop policy if exists "recipient reads notifications" on public.notifications;
create policy "recipient reads notifications" on public.notifications for select to authenticated using(recipient_id=auth.uid());
drop policy if exists "recipient marks notifications read" on public.notifications;
create policy "recipient marks notifications read" on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());

drop policy if exists "active interests are readable" on public.interests;
create policy "active interests are readable" on public.interests for select using(is_active);
drop policy if exists "public discover interests readable" on public.profile_interests;
create policy "public discover interests readable" on public.profile_interests for select using(visibility='public' or profile_id=auth.uid());
drop policy if exists "users manage own interests" on public.profile_interests;
create policy "users manage own interests" on public.profile_interests for all using(profile_id=auth.uid()) with check(profile_id=auth.uid());

drop policy if exists "public studios readable" on public.studios;
create policy "public studios readable" on public.studios for select using(is_public or owner_id=auth.uid());
drop policy if exists "studio owner manages profile" on public.studios;
create policy "studio owner manages profile" on public.studios for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "published store products are discoverable" on public.store_products;
create policy "published store products are discoverable" on public.store_products for select using(status='published' or created_by=auth.uid() or exists(select 1 from public.houses h where h.id=store_products.house_id and h.owner_id=auth.uid()));
drop policy if exists "house owners manage store products" on public.store_products;
create policy "house owners manage store products" on public.store_products for all using(created_by=auth.uid() or exists(select 1 from public.houses h where h.id=store_products.house_id and h.owner_id=auth.uid())) with check(created_by=auth.uid() or exists(select 1 from public.houses h where h.id=store_products.house_id and h.owner_id=auth.uid()));

drop policy if exists "financial dynamics participants can read" on public.financial_dynamics;
create policy "financial dynamics participants can read" on public.financial_dynamics for select using(auth.uid() in (dom_id,sub_id));
drop policy if exists "participants can read tribute requests" on public.tribute_requests;
create policy "participants can read tribute requests" on public.tribute_requests for select using(exists(select 1 from public.financial_dynamics d where d.id=dynamic_id and auth.uid() in (d.dom_id,d.sub_id)));

-- -----------------------------------------------------------------------------
-- API GRANTS / SCHEMA CACHE
-- -----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update on public.houses to authenticated;
grant select,insert,update on public.applications to authenticated;
grant select on public.memberships to authenticated;
grant select,insert,update on public.tasks to authenticated;
grant select,insert,update on public.task_submissions to authenticated;
grant select,insert on public.task_submission_files to authenticated;
grant select,insert,update,delete on public.journal_entries to authenticated;
grant select,insert,update on public.profile_details to authenticated;
grant select,insert,update on public.messages to authenticated;
grant select,insert,update,delete on public.studio_days to authenticated;
grant select on public.studio_slots to authenticated;
grant select on public.slot_bookings to authenticated;
grant select on public.calendar_events to authenticated;
grant select,insert,update on public.sessions to authenticated;
grant select,update on public.notifications to authenticated;
grant select on public.interests to authenticated;
grant select,insert,update,delete on public.profile_interests to authenticated;
grant select on public.studios to authenticated;
grant select on public.studio_availability to authenticated;
grant select on public.store_products to authenticated;
grant select on public.store_orders to authenticated;
grant select on public.store_access_grants to authenticated;
grant select on public.financial_dynamics to authenticated;
grant select on public.tribute_requests to authenticated;
grant select on public.task_calendar_feed to authenticated;

notify pgrst, 'reload schema';

-- Final diagnostic: should return one row per required object.
select object_name, ok from (
  values
    ('profiles', to_regclass('public.profiles') is not null),
    ('houses', to_regclass('public.houses') is not null),
    ('tasks', to_regclass('public.tasks') is not null),
    ('studio_days', to_regclass('public.studio_days') is not null),
    ('slot_bookings', to_regclass('public.slot_bookings') is not null),
    ('publish_studio_window', to_regprocedure('public.publish_studio_window(date,time without time zone,time without time zone,text,integer)') is not null),
    ('get_visible_studio_windows', to_regprocedure('public.get_visible_studio_windows()') is not null)
) as checks(object_name,ok)
order by object_name;
