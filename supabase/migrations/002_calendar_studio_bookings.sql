-- House of Doms: Kalender, Studio-Tage und Buchungen

create type public.calendar_event_type as enum ('task', 'studio_day', 'booking', 'personal');
create type public.booking_status as enum ('requested', 'confirmed', 'declined', 'cancelled', 'completed');

create table public.studio_days (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null,
  starts_at time not null,
  ends_at time not null,
  studio_name text not null,
  studio_address text,
  description text,
  slot_length_minutes integer not null default 60 check (slot_length_minutes between 15 and 480),
  break_minutes integer not null default 15 check (break_minutes between 0 and 180),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'EUR',
  is_public boolean not null default false,
  booking_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.studio_slots (
  id uuid primary key default gen_random_uuid(),
  studio_day_id uuid not null references public.studio_days(id) on delete cascade,
  starts_at time not null,
  ends_at time not null,
  is_available boolean not null default true,
  capacity integer not null default 1 check (capacity between 1 and 20),
  created_at timestamptz not null default now(),
  unique (studio_day_id, starts_at, ends_at),
  check (ends_at > starts_at)
);

create table public.slot_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.studio_slots(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status public.booking_status not null default 'requested',
  note text,
  dom_note text,
  price_cents integer,
  currency text not null default 'EUR',
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  unique (slot_id, requester_id)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  event_type public.calendar_event_type not null,
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
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index studio_days_house_date_idx on public.studio_days(house_id, event_date);
create index studio_slots_day_idx on public.studio_slots(studio_day_id, starts_at);
create index slot_bookings_requester_idx on public.slot_bookings(requester_id, status);
create index calendar_events_house_date_idx on public.calendar_events(house_id, event_date);

alter table public.studio_days enable row level security;
alter table public.studio_slots enable row level security;
alter table public.slot_bookings enable row level security;
alter table public.calendar_events enable row level security;

create policy "house members can view studio days"
on public.studio_days for select
using (
  is_public = true
  or exists (select 1 from public.house_memberships hm where hm.house_id = studio_days.house_id and hm.profile_id = auth.uid())
  or creator_id = auth.uid()
);

create policy "house owners manage studio days"
on public.studio_days for all
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "visible slots follow studio day access"
on public.studio_slots for select
using (exists (select 1 from public.studio_days sd where sd.id = studio_slots.studio_day_id and (sd.is_public = true or sd.creator_id = auth.uid() or exists (select 1 from public.house_memberships hm where hm.house_id = sd.house_id and hm.profile_id = auth.uid()))));

create policy "studio owners manage slots"
on public.studio_slots for all
using (exists (select 1 from public.studio_days sd where sd.id = studio_slots.studio_day_id and sd.creator_id = auth.uid()))
with check (exists (select 1 from public.studio_days sd where sd.id = studio_slots.studio_day_id and sd.creator_id = auth.uid()));

create policy "requesters and house owners view bookings"
on public.slot_bookings for select
using (
  requester_id = auth.uid()
  or exists (select 1 from public.houses h where h.id = slot_bookings.house_id and h.owner_id = auth.uid())
);

create policy "members request available slots"
on public.slot_bookings for insert
with check (
  requester_id = auth.uid()
  and exists (select 1 from public.studio_slots ss where ss.id = slot_bookings.slot_id and ss.is_available = true)
);

create policy "requester or house owner updates booking"
on public.slot_bookings for update
using (
  requester_id = auth.uid()
  or exists (select 1 from public.houses h where h.id = slot_bookings.house_id and h.owner_id = auth.uid())
)
with check (
  requester_id = auth.uid()
  or exists (select 1 from public.houses h where h.id = slot_bookings.house_id and h.owner_id = auth.uid())
);

create policy "house members view calendar"
on public.calendar_events for select
using (
  owner_id = auth.uid()
  or exists (select 1 from public.house_memberships hm where hm.house_id = calendar_events.house_id and hm.profile_id = auth.uid())
);

create policy "users manage own calendar events"
on public.calendar_events for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.generate_studio_slots(day_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  studio public.studio_days;
  cursor_time time;
  slot_end time;
begin
  select * into studio from public.studio_days where id = day_id;
  if studio.creator_id <> auth.uid() then raise exception 'not allowed'; end if;
  delete from public.studio_slots where studio_day_id = day_id;
  cursor_time := studio.starts_at;
  loop
    slot_end := cursor_time + make_interval(mins => studio.slot_length_minutes);
    exit when slot_end > studio.ends_at;
    insert into public.studio_slots(studio_day_id, starts_at, ends_at) values(day_id, cursor_time, slot_end);
    cursor_time := slot_end + make_interval(mins => studio.break_minutes);
  end loop;
end;
$$;
