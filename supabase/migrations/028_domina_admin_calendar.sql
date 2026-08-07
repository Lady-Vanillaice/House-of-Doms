-- House of Doms: advanced Domina calendar, adapted from Lady Vanillaice admin calendar
alter table public.studio_days add column if not exists room text;
alter table public.studio_days add column if not exists is_duo boolean not null default false;
alter table public.studio_days add column if not exists duo_partner text;
alter table public.studio_days add column if not exists is_content_shoot boolean not null default false;
alter table public.studio_days add column if not exists internal_note text;
alter table public.studio_days add column if not exists buffer_minutes integer not null default 45;
alter table public.studio_days add column if not exists is_hidden boolean not null default false;

create or replace function public.publish_advanced_studio_window(
  p_event_date date,
  p_starts_at time,
  p_ends_at time,
  p_studio_name text,
  p_room text default null,
  p_is_duo boolean default false,
  p_duo_partner text default null,
  p_is_content_shoot boolean default false,
  p_internal_note text default null,
  p_buffer_minutes integer default 45,
  p_is_hidden boolean default false,
  p_price_cents integer default null,
  p_second_starts_at time default null,
  p_second_ends_at time default null
) returns setof public.studio_days
language plpgsql security definer set search_path=public as $$
declare
  v_role text; v_house uuid; v_row public.studio_days;
begin
  select role::text into v_role from public.profiles where id=auth.uid();
  if v_role not in ('dom','domina') then raise exception 'Nur Dom/Domina darf Studiozeiten veröffentlichen.'; end if;
  select id into v_house from public.houses where owner_id=auth.uid() limit 1;
  if v_house is null then raise exception 'Kein eigenes House gefunden.'; end if;
  if p_ends_at <= p_starts_at then raise exception 'Ende muss nach Beginn liegen.'; end if;
  if coalesce(p_buffer_minutes,0) < 0 or coalesce(p_buffer_minutes,0) > 240 then raise exception 'Puffer muss zwischen 0 und 240 Minuten liegen.'; end if;

  insert into public.studio_days(house_id,creator_id,event_date,starts_at,ends_at,studio_name,room,is_duo,duo_partner,is_content_shoot,internal_note,buffer_minutes,is_hidden,price_cents,is_public,booking_enabled,description)
  values(v_house,auth.uid(),p_event_date,p_starts_at,p_ends_at,trim(p_studio_name),nullif(trim(coalesce(p_room,'')),''),p_is_duo,case when p_is_duo then nullif(trim(coalesce(p_duo_partner,'')),'') end,p_is_content_shoot,nullif(trim(coalesce(p_internal_note,'')),''),coalesce(p_buffer_minutes,45),p_is_hidden,p_price_cents,not p_is_hidden,true,null)
  returning * into v_row; return next v_row;

  if p_second_starts_at is not null or p_second_ends_at is not null then
    if p_second_starts_at is null or p_second_ends_at is null or p_second_ends_at <= p_second_starts_at then raise exception 'Zweites Zeitfenster ist ungültig.'; end if;
    insert into public.studio_days(house_id,creator_id,event_date,starts_at,ends_at,studio_name,room,is_duo,duo_partner,is_content_shoot,internal_note,buffer_minutes,is_hidden,price_cents,is_public,booking_enabled,description)
    values(v_house,auth.uid(),p_event_date,p_second_starts_at,p_second_ends_at,trim(p_studio_name),nullif(trim(coalesce(p_room,'')),''),p_is_duo,case when p_is_duo then nullif(trim(coalesce(p_duo_partner,'')),'') end,p_is_content_shoot,nullif(trim(coalesce(p_internal_note,'')),''),coalesce(p_buffer_minutes,45),p_is_hidden,p_price_cents,not p_is_hidden,true,null)
    returning * into v_row; return next v_row;
  end if;
end $$;

grant execute on function public.publish_advanced_studio_window(date,time,time,text,text,boolean,text,boolean,text,integer,boolean,integer,time,time) to authenticated;

create or replace function public.get_my_studio_windows_admin()
returns table(id uuid,house_id uuid,event_date date,starts_at time,ends_at time,studio_name text,room text,is_duo boolean,duo_partner text,is_content_shoot boolean,internal_note text,buffer_minutes integer,is_hidden boolean,price_cents integer,is_public boolean,booking_enabled boolean)
language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  select role::text into v_role from public.profiles where id=auth.uid();
  if v_role not in ('dom','domina') then raise exception 'Forbidden'; end if;
  return query select s.id,s.house_id,s.event_date,s.starts_at,s.ends_at,s.studio_name,s.room,s.is_duo,s.duo_partner,s.is_content_shoot,s.internal_note,s.buffer_minutes,s.is_hidden,s.price_cents,s.is_public,s.booking_enabled
  from public.studio_days s join public.houses h on h.id=s.house_id where h.owner_id=auth.uid() order by s.event_date,s.starts_at;
end $$;
grant execute on function public.get_my_studio_windows_admin() to authenticated;

create or replace function public.get_visible_studio_windows_advanced()
returns table(id uuid,house_id uuid,event_date date,starts_at time,ends_at time,studio_name text,room text,is_duo boolean,duo_partner text,is_content_shoot boolean,buffer_minutes integer,price_cents integer)
language sql security definer set search_path=public as $$
  select s.id,s.house_id,s.event_date,s.starts_at,s.ends_at,s.studio_name,s.room,s.is_duo,s.duo_partner,s.is_content_shoot,s.buffer_minutes,s.price_cents
  from public.studio_days s
  where s.is_public=true and s.booking_enabled=true and coalesce(s.is_hidden,false)=false and s.event_date>=current_date
  and exists(select 1 from public.memberships m where m.house_id=s.house_id and m.member_id=auth.uid() and m.ended_at is null)
  order by s.event_date,s.starts_at
$$;
grant execute on function public.get_visible_studio_windows_advanced() to authenticated;

create or replace function public.update_my_studio_window_visibility(p_id uuid,p_hidden boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.studio_days s join public.houses h on h.id=s.house_id where s.id=p_id and h.owner_id=auth.uid()) then raise exception 'Forbidden'; end if;
  update public.studio_days set is_hidden=p_hidden,is_public=not p_hidden,updated_at=now() where id=p_id;
end $$;
grant execute on function public.update_my_studio_window_visibility(uuid,boolean) to authenticated;

create or replace function public.delete_my_studio_window(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.studio_days s join public.houses h on h.id=s.house_id where s.id=p_id and h.owner_id=auth.uid()) then raise exception 'Forbidden'; end if;
  if exists(select 1 from public.slot_bookings b where b.studio_day_id=p_id and b.status in ('requested','confirmed')) then raise exception 'Zeitfenster hat aktive Buchungen.'; end if;
  delete from public.studio_days where id=p_id;
end $$;
grant execute on function public.delete_my_studio_window(uuid) to authenticated;

select pg_notify('pgrst','reload schema');