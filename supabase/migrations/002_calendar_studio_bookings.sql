-- House of Doms: Kalender, Studio-Tage und Buchungen
-- Diese Migration ist idempotent und kann gefahrlos erneut ausgeführt werden.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'calendar_event_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.calendar_event_type AS ENUM ('task', 'studio_day', 'booking', 'personal');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'booking_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.booking_status AS ENUM ('requested', 'confirmed', 'declined', 'cancelled', 'completed');
  END IF;
END
$$;

ALTER TYPE public.calendar_event_type ADD VALUE IF NOT EXISTS 'task';
ALTER TYPE public.calendar_event_type ADD VALUE IF NOT EXISTS 'studio_day';
ALTER TYPE public.calendar_event_type ADD VALUE IF NOT EXISTS 'booking';
ALTER TYPE public.calendar_event_type ADD VALUE IF NOT EXISTS 'personal';

ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'declined';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'completed';

CREATE TABLE IF NOT EXISTS public.studio_days (
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

CREATE TABLE IF NOT EXISTS public.studio_slots (
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

CREATE TABLE IF NOT EXISTS public.slot_bookings (
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

CREATE TABLE IF NOT EXISTS public.calendar_events (
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

CREATE INDEX IF NOT EXISTS studio_days_house_date_idx ON public.studio_days(house_id, event_date);
CREATE INDEX IF NOT EXISTS studio_slots_day_idx ON public.studio_slots(studio_day_id, starts_at);
CREATE INDEX IF NOT EXISTS slot_bookings_requester_idx ON public.slot_bookings(requester_id, status);
CREATE INDEX IF NOT EXISTS calendar_events_house_date_idx ON public.calendar_events(house_id, event_date);

ALTER TABLE public.studio_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "house members can view studio days" ON public.studio_days;
CREATE POLICY "house members can view studio days"
ON public.studio_days FOR SELECT
USING (
  is_public = true
  OR creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.house_id = studio_days.house_id
      AND m.member_id = auth.uid()
      AND m.ended_at IS NULL
  )
);

DROP POLICY IF EXISTS "house owners manage studio days" ON public.studio_days;
CREATE POLICY "house owners manage studio days"
ON public.studio_days FOR ALL
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "visible slots follow studio day access" ON public.studio_slots;
CREATE POLICY "visible slots follow studio day access"
ON public.studio_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.studio_days sd
    WHERE sd.id = studio_slots.studio_day_id
      AND (
        sd.is_public = true
        OR sd.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.house_id = sd.house_id
            AND m.member_id = auth.uid()
            AND m.ended_at IS NULL
        )
      )
  )
);

DROP POLICY IF EXISTS "studio owners manage slots" ON public.studio_slots;
CREATE POLICY "studio owners manage slots"
ON public.studio_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.studio_days sd
    WHERE sd.id = studio_slots.studio_day_id
      AND sd.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.studio_days sd
    WHERE sd.id = studio_slots.studio_day_id
      AND sd.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "requesters and house owners view bookings" ON public.slot_bookings;
CREATE POLICY "requesters and house owners view bookings"
ON public.slot_bookings FOR SELECT
USING (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.houses h
    WHERE h.id = slot_bookings.house_id
      AND h.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "members request available slots" ON public.slot_bookings;
CREATE POLICY "members request available slots"
ON public.slot_bookings FOR INSERT
WITH CHECK (
  requester_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.studio_slots ss
    WHERE ss.id = slot_bookings.slot_id
      AND ss.is_available = true
  )
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.house_id = slot_bookings.house_id
      AND m.member_id = auth.uid()
      AND m.ended_at IS NULL
  )
);

DROP POLICY IF EXISTS "requester or house owner updates booking" ON public.slot_bookings;
CREATE POLICY "requester or house owner updates booking"
ON public.slot_bookings FOR UPDATE
USING (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.houses h
    WHERE h.id = slot_bookings.house_id
      AND h.owner_id = auth.uid()
  )
)
WITH CHECK (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.houses h
    WHERE h.id = slot_bookings.house_id
      AND h.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "house members view calendar" ON public.calendar_events;
CREATE POLICY "house members view calendar"
ON public.calendar_events FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.house_id = calendar_events.house_id
      AND m.member_id = auth.uid()
      AND m.ended_at IS NULL
  )
);

DROP POLICY IF EXISTS "users manage own calendar events" ON public.calendar_events;
CREATE POLICY "users manage own calendar events"
ON public.calendar_events FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.generate_studio_slots(day_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  studio public.studio_days;
  cursor_time time;
  slot_end time;
BEGIN
  SELECT * INTO studio FROM public.studio_days WHERE id = day_id;

  IF studio.id IS NULL THEN
    RAISE EXCEPTION 'studio day not found';
  END IF;

  IF studio.creator_id <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  DELETE FROM public.studio_slots WHERE studio_day_id = day_id;
  cursor_time := studio.starts_at;

  LOOP
    slot_end := cursor_time + make_interval(mins => studio.slot_length_minutes);
    EXIT WHEN slot_end > studio.ends_at;

    INSERT INTO public.studio_slots(studio_day_id, starts_at, ends_at)
    VALUES(day_id, cursor_time, slot_end);

    cursor_time := slot_end + make_interval(mins => studio.break_minutes);
  END LOOP;
END;
$$;
