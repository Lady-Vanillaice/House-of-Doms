-- House of Doms: private Dom/Domina calendar subscription feed
-- Each House gets its own secret UUID token. The public RPC only returns data
-- when the exact token is supplied; Subs cannot ask for or rotate the token.

alter table public.houses
  add column if not exists calendar_feed_token uuid default gen_random_uuid();

update public.houses
set calendar_feed_token = gen_random_uuid()
where calendar_feed_token is null;

alter table public.houses
  alter column calendar_feed_token set default gen_random_uuid();

create unique index if not exists houses_calendar_feed_token_uidx
  on public.houses(calendar_feed_token)
  where calendar_feed_token is not null;

create or replace function public.get_my_calendar_feed_token()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_token uuid;
begin
  select role::text into v_role
  from public.profiles
  where id = auth.uid();

  if v_role not in ('dom','domina') then
    raise exception 'Nur Dom/Domina hat einen privaten Kalender-Feed.';
  end if;

  select calendar_feed_token into v_token
  from public.houses
  where owner_id = auth.uid()
  limit 1;

  if v_token is null then
    update public.houses
    set calendar_feed_token = gen_random_uuid()
    where owner_id = auth.uid()
    returning calendar_feed_token into v_token;
  end if;

  return v_token;
end;
$$;

grant execute on function public.get_my_calendar_feed_token() to authenticated;

create or replace function public.rotate_my_calendar_feed_token()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_token uuid := gen_random_uuid();
begin
  select role::text into v_role from public.profiles where id = auth.uid();
  if v_role not in ('dom','domina') then raise exception 'Forbidden'; end if;

  update public.houses
  set calendar_feed_token = v_token
  where owner_id = auth.uid();

  if not found then raise exception 'Kein eigenes House gefunden.'; end if;
  return v_token;
end;
$$;

grant execute on function public.rotate_my_calendar_feed_token() to authenticated;

-- Token-protected feed. SECURITY DEFINER intentionally bypasses RLS, but only
-- returns rows belonging to the House identified by the unguessable token.
create or replace function public.get_dom_calendar_feed(p_token uuid)
returns table(
  event_uid text,
  event_kind text,
  title text,
  description text,
  location text,
  event_date date,
  starts_at time,
  ends_at time,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with target_house as (
    select h.id, h.owner_id
    from public.houses h
    where h.calendar_feed_token = p_token
    limit 1
  ),
  studio_events as (
    select
      'studio-' || s.id::text as event_uid,
      'studio'::text as event_kind,
      case
        when coalesce(s.is_hidden,false) then 'Studiozeit · intern'
        else 'Studiozeit · verfügbar'
      end as title,
      concat_ws(E'\n',
        case when s.is_duo then 'Duo-Session' || case when nullif(s.duo_partner,'') is not null then ' mit ' || s.duo_partner else '' end end,
        case when s.is_content_shoot then 'Content-Dreh' end,
        case when nullif(s.internal_note,'') is not null then 'Interne Notiz: ' || s.internal_note end,
        'Puffer: ' || coalesce(s.buffer_minutes,45)::text || ' Min.'
      ) as description,
      concat_ws(' · ', nullif(s.studio_name,''), nullif(s.room,'')) as location,
      s.event_date,
      s.starts_at,
      s.ends_at,
      coalesce(s.updated_at,s.created_at,now()) as updated_at
    from public.studio_days s
    join target_house h on h.id = s.house_id
  ),
  booking_events as (
    select
      'booking-' || b.id::text as event_uid,
      'booking'::text as event_kind,
      'Session · ' || coalesce(nullif(p.display_name,''),'Sub/Sklave') as title,
      concat_ws(E'\n',
        case when nullif(b.note,'') is not null then 'Notiz: ' || b.note end,
        case when nullif(b.dom_note,'') is not null then 'Dom-Notiz: ' || b.dom_note end,
        case when s.is_duo then 'Duo-Session' || case when nullif(s.duo_partner,'') is not null then ' mit ' || s.duo_partner else '' end end,
        case when s.is_content_shoot then 'Content-Dreh' end
      ) as description,
      concat_ws(' · ', nullif(s.studio_name,''), nullif(s.room,'')) as location,
      s.event_date,
      b.starts_at,
      b.ends_at,
      coalesce(b.confirmed_at,b.requested_at,now()) as updated_at
    from public.slot_bookings b
    join target_house h on h.id = b.house_id
    join public.studio_days s on s.id = b.studio_day_id
    left join public.profiles p on p.id = b.requester_id
    where b.status in ('confirmed','completed')
      and b.starts_at is not null
      and b.ends_at is not null
  )
  select * from studio_events
  union all
  select * from booking_events
  order by event_date, starts_at;
$$;

grant execute on function public.get_dom_calendar_feed(uuid) to anon, authenticated;

select pg_notify('pgrst','reload schema');
