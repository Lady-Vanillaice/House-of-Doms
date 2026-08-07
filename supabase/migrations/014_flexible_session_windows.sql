-- Flexible Studio-Sessions
-- Dom/Domina definiert nur ein Zeitfenster. Sub/Sklave waehlt Start und Ende selbst.

alter table public.slot_bookings
  add column if not exists studio_day_id uuid references public.studio_days(id) on delete cascade,
  add column if not exists starts_at time,
  add column if not exists ends_at time;

alter table public.slot_bookings alter column slot_id drop not null;

-- Bestehende Slot-Buchungen in das neue direkte Zeitmodell uebernehmen.
update public.slot_bookings b
set
  studio_day_id = coalesce(b.studio_day_id, s.studio_day_id),
  starts_at = coalesce(b.starts_at, s.starts_at),
  ends_at = coalesce(b.ends_at, s.ends_at)
from public.studio_slots s
where b.slot_id = s.id
  and (b.studio_day_id is null or b.starts_at is null or b.ends_at is null);

create index if not exists slot_bookings_studio_day_time_idx
  on public.slot_bookings(studio_day_id, starts_at, ends_at);

-- Neue Buchungen werden ueber diese Funktion angefragt. Sie prueft Zeitfenster,
-- Berechtigung und Ueberschneidungen serverseitig.
create or replace function public.request_studio_booking(
  p_studio_day_id uuid,
  p_starts_at time,
  p_ends_at time,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day public.studio_days;
  v_booking_id uuid;
  v_price integer;
  v_minutes numeric;
begin
  if auth.uid() is null then
    raise exception 'Bitte zuerst anmelden.';
  end if;

  select * into v_day
  from public.studio_days
  where id = p_studio_day_id;

  if v_day.id is null then
    raise exception 'Studio-Tag nicht gefunden.';
  end if;

  if not v_day.booking_enabled then
    raise exception 'Buchungen sind fuer dieses Zeitfenster deaktiviert.';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'Die Endzeit muss nach der Startzeit liegen.';
  end if;

  if p_starts_at < v_day.starts_at or p_ends_at > v_day.ends_at then
    raise exception 'Die Session muss vollstaendig innerhalb des angebotenen Zeitfensters liegen.';
  end if;

  if not (
    v_day.is_public = true
    or exists (
      select 1 from public.memberships m
      where m.house_id = v_day.house_id
        and m.member_id = auth.uid()
        and m.ended_at is null
    )
  ) then
    raise exception 'Du darfst dieses Zeitfenster nicht buchen.';
  end if;

  if exists (
    select 1
    from public.slot_bookings b
    where b.studio_day_id = p_studio_day_id
      and b.status in ('requested', 'confirmed')
      and b.starts_at is not null
      and b.ends_at is not null
      and p_starts_at < b.ends_at
      and p_ends_at > b.starts_at
  ) then
    raise exception 'Dieser Zeitraum ueberschneidet sich bereits mit einer anderen Buchung.';
  end if;

  v_price := null;
  if v_day.price_cents is not null then
    v_minutes := extract(epoch from (p_ends_at - p_starts_at)) / 60.0;
    v_price := round(v_day.price_cents * v_minutes / 60.0);
  end if;

  insert into public.slot_bookings (
    slot_id,
    studio_day_id,
    house_id,
    requester_id,
    status,
    note,
    starts_at,
    ends_at,
    price_cents,
    currency
  ) values (
    null,
    p_studio_day_id,
    v_day.house_id,
    auth.uid(),
    'requested',
    nullif(trim(coalesce(p_note, '')), ''),
    p_starts_at,
    p_ends_at,
    v_price,
    v_day.currency
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.request_studio_booking(uuid, time, time, text) to authenticated;

-- Direkte Inserts bleiben fuer neue flexible Buchungen gesperrt; die RPC-Funktion
-- ist der einzige neue Schreibweg und validiert alle Regeln zentral.
drop policy if exists "members or public visitors request available slots" on public.slot_bookings;
drop policy if exists "members request available slots" on public.slot_bookings;

-- Die vorhandene SELECT-/UPDATE-Policy bleibt bestehen. Die RPC-Funktion laeuft
-- als security definer und kann nach erfolgreicher Validierung die Anfrage anlegen.
