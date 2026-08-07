-- Zuverlaessiges Laden von Studio-Zeitfenstern fuer Kalender und Agenda.
-- Die Funktion respektiert die Benutzerrolle und gibt nur erlaubte Zeitfenster zurueck.

create or replace function public.get_visible_studio_windows()
returns table (
  id uuid,
  house_id uuid,
  event_date date,
  starts_at time,
  ends_at time,
  studio_name text,
  price_cents integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    sd.id,
    sd.house_id,
    sd.event_date,
    sd.starts_at,
    sd.ends_at,
    sd.studio_name,
    sd.price_cents
  from public.studio_days sd
  where auth.uid() is not null
    and (
      sd.creator_id = auth.uid()
      or sd.is_public = true
      or exists (
        select 1
        from public.memberships m
        where m.house_id = sd.house_id
          and m.member_id = auth.uid()
          and m.ended_at is null
      )
    )
  order by sd.event_date asc, sd.starts_at asc;
$$;

grant execute on function public.get_visible_studio_windows() to authenticated;
