-- Reparatur fuer das Veröffentlichen von Studio-Zeitfenstern.
-- Stellt explizite PostgREST-Rechte, House-Zuordnung und RLS fuer Dom/Domina sicher.

-- Bestehende Auth-Metadaten fuer Dom/Domina bei Bedarf in public.profiles spiegeln.
update public.profiles p
set
  role = case lower(coalesce(u.raw_user_meta_data ->> 'role', p.role::text))
    when 'dom' then 'dom'::public.user_role
    when 'domina' then 'domina'::public.user_role
    else p.role
  end,
  updated_at = now()
from auth.users u
where u.id = p.id
  and lower(coalesce(u.raw_user_meta_data ->> 'role', '')) in ('dom','domina');

-- Jeder Dom / jede Domina braucht fuer Kalenderdaten ein House.
insert into public.houses (
  owner_id,
  name,
  welcome_message,
  relationship_style,
  applications_open,
  is_public
)
select
  p.id,
  coalesce(nullif(p.display_name, ''), 'House') || ' · House',
  '',
  'private_circle',
  true,
  true
from public.profiles p
where p.role in ('dom','domina')
  and not exists (
    select 1 from public.houses h where h.owner_id = p.id
  );

-- Explizite API-Rechte. RLS bleibt weiterhin die eigentliche Zugriffskontrolle.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.houses to authenticated;
grant select on public.memberships to authenticated;
grant select on public.tasks to authenticated;
grant select, insert, update, delete on public.studio_days to authenticated;
grant select on public.studio_slots to authenticated;
grant select on public.slot_bookings to authenticated;
grant select on public.calendar_events to authenticated;

alter table public.studio_days enable row level security;

-- Alte Policy ersetzen durch klar getrennte Rechte.
drop policy if exists "house owners manage studio days" on public.studio_days;
drop policy if exists "doms publish studio days" on public.studio_days;
drop policy if exists "doms update studio days" on public.studio_days;
drop policy if exists "doms delete studio days" on public.studio_days;

create policy "doms publish studio days"
on public.studio_days
for insert
to authenticated
with check (
  creator_id = auth.uid()
  and exists (
    select 1
    from public.houses h
    where h.id = studio_days.house_id
      and h.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('dom','domina')
  )
);

create policy "doms update studio days"
on public.studio_days
for update
to authenticated
using (
  creator_id = auth.uid()
  and exists (
    select 1 from public.houses h
    where h.id = studio_days.house_id
      and h.owner_id = auth.uid()
  )
)
with check (
  creator_id = auth.uid()
  and exists (
    select 1 from public.houses h
    where h.id = studio_days.house_id
      and h.owner_id = auth.uid()
  )
);

create policy "doms delete studio days"
on public.studio_days
for delete
to authenticated
using (
  creator_id = auth.uid()
  and exists (
    select 1 from public.houses h
    where h.id = studio_days.house_id
      and h.owner_id = auth.uid()
  )
);

-- Hilfsfunktion fuer Diagnose im SQL Editor: zeigt das aktuelle Kalender-Setup an.
create or replace function public.calendar_publish_status()
returns table (
  user_id uuid,
  profile_role text,
  house_id uuid,
  can_publish boolean
)
language sql
security definer
set search_path = public
as $$
  select
    auth.uid(),
    p.role::text,
    h.id,
    (p.role in ('dom','domina') and h.id is not null)
  from public.profiles p
  left join public.houses h on h.owner_id = p.id
  where p.id = auth.uid();
$$;

grant execute on function public.calendar_publish_status() to authenticated;
