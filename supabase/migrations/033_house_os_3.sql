-- House of Doms — House OS 3.0
-- Timeline, chastity analytics, studio automation, security log and platform-admin foundation.

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists security_events_user_idx on public.security_events(user_id,created_at desc);
alter table public.security_events enable row level security;
drop policy if exists "users read own security events" on public.security_events;
create policy "users read own security events" on public.security_events for select to authenticated using(user_id=auth.uid());
grant select on public.security_events to authenticated;

create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
drop policy if exists "platform admins read admin list" on public.platform_admins;
create policy "platform admins read admin list" on public.platform_admins for select to authenticated
using(exists(select 1 from public.platform_admins a where a.user_id=auth.uid()));
grant select on public.platform_admins to authenticated;

create or replace function public.get_house_timeline(p_limit integer default 80)
returns table(id text,event_type text,title text,detail text,actor_name text,created_at timestamptz,href text)
language plpgsql security definer set search_path=public stable as $$
declare v_house uuid; v_owner uuid;
begin
  select h.id,h.owner_id into v_house,v_owner from public.houses h
  where h.owner_id=auth.uid() or exists(select 1 from public.memberships m where m.house_id=h.id and m.member_id=auth.uid() and m.ended_at is null)
  order by (h.owner_id=auth.uid()) desc limit 1;
  if v_house is null then return; end if;
  return query
  select * from (
    select 'msg-'||m.id::text,'message'::text,'Neue Nachricht'::text,
      coalesce(nullif(m.body,''),case m.attachment_type when 'image' then 'Bild' when 'video' then 'Video' when 'audio' then 'Sprachnachricht' when 'file' then 'Datei' else 'Nachricht' end),
      coalesce(p.display_name,'Mitglied'),m.created_at,'/kammer?contact='||case when m.sender_id=auth.uid() then m.recipient_id::text else m.sender_id::text end
    from public.messages m left join public.profiles p on p.id=m.sender_id
    where auth.uid() in (m.sender_id,m.recipient_id)
    union all
    select 'task-'||t.id::text,'task','Aufgabe · '||t.title,
      'Status: '||t.status::text,coalesce(p.display_name,'Mitglied'),coalesce(t.updated_at,t.created_at),'/aufgaben'
    from public.tasks t left join public.profiles p on p.id=t.assigned_to
    where t.house_id=v_house and (v_owner=auth.uid() or t.assigned_to=auth.uid())
    union all
    select 'book-'||b.id::text,'booking','Session · '||coalesce(p.display_name,'House-Mitglied'),
      'Status: '||b.status,coalesce(p.display_name,'House-Mitglied'),coalesce(b.confirmed_at,b.requested_at),'/kalender'
    from public.slot_bookings b left join public.profiles p on p.id=b.requester_id where b.house_id=v_house and (v_owner=auth.uid() or b.requester_id=auth.uid())
    union all
    select 'ch-'||c.id::text,'chastity','Keuschhaltung · '||coalesce(p.display_name,'Sub/Sklave'),
      'Status: '||c.status,coalesce(p.display_name,'Sub/Sklave'),coalesce(c.updated_at,c.created_at),'/keuschhaltung'
    from public.chastity_records c left join public.profiles p on p.id=c.sub_id where c.house_id=v_house and auth.uid() in (c.dom_id,c.sub_id)
    union all
    select 'app-'||a.id::text,'application','Bewerbung · '||a.subject,
      'Status: '||a.status,coalesce(p.display_name,'Bewerber/in'),a.created_at,'/bewerbungen'
    from public.house_applications a left join public.profiles p on p.id=a.applicant_id where a.house_id=v_house and auth.uid() in (a.applicant_id,a.target_dom_id)
    union all
    select 'cash-'||e.id::text,'cashbook',case when e.entry_type='income' then 'Einnahme' else 'Ausgabe' end,
      coalesce(e.customer,'')||case when e.amount_cents>0 then ' · '||to_char(e.amount_cents/100.0,'FM999999990.00')||' €' else '' end,
      'Kassenbuch'::text,e.created_at,'/kassenbuch'
    from public.dom_cashbook_entries e where e.owner_id=auth.uid()
  ) x
  order by x.created_at desc
  limit greatest(1,least(coalesce(p_limit,80),200));
end $$;
grant execute on function public.get_house_timeline(integer) to authenticated;

create or replace function public.get_chastity_analytics()
returns table(active_count bigint,total_records bigint,total_days numeric,longest_days numeric,okay_checkins bigint,discomfort_checkins bigint,emergency_checkins bigint)
language plpgsql security definer set search_path=public stable as $$
declare v_house uuid;
begin
 select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
 if v_house is null then raise exception 'Nur Dom/Domina.'; end if;
 return query select
  count(*) filter(where c.status='active'),count(*),
  round(coalesce(sum(extract(epoch from (coalesce(c.ended_at,now())-c.started_at))/86400),0)::numeric,1),
  round(coalesce(max(extract(epoch from (coalesce(c.ended_at,now())-c.started_at))/86400),0)::numeric,1),
  (select count(*) from public.chastity_checkins i join public.chastity_records r on r.id=i.record_id where r.house_id=v_house and i.comfort_status='okay'),
  (select count(*) from public.chastity_checkins i join public.chastity_records r on r.id=i.record_id where r.house_id=v_house and i.comfort_status='discomfort'),
  (select count(*) from public.chastity_checkins i join public.chastity_records r on r.id=i.record_id where r.house_id=v_house and i.comfort_status='emergency')
 from public.chastity_records c where c.house_id=v_house;
end $$;
grant execute on function public.get_chastity_analytics() to authenticated;

create or replace function public.duplicate_my_studio_window(p_id uuid,p_days integer default 7)
returns uuid language plpgsql security definer set search_path=public as $$
declare s public.studio_days; v_id uuid; v_new_date date;
begin
 select sd.* into s from public.studio_days sd join public.houses h on h.id=sd.house_id where sd.id=p_id and h.owner_id=auth.uid();
 if s.id is null then raise exception 'Nicht erlaubt.'; end if;
 v_new_date:=s.event_date+greatest(1,least(coalesce(p_days,7),365));
 if exists(select 1 from public.studio_days x where x.house_id=s.house_id and x.event_date=v_new_date and s.starts_at<x.ends_at and s.ends_at>x.starts_at) then raise exception 'Am Zieldatum gibt es eine Überschneidung.'; end if;
 insert into public.studio_days(house_id,creator_id,event_date,starts_at,ends_at,studio_name,studio_address,description,slot_length_minutes,break_minutes,price_cents,currency,is_public,booking_enabled,room,is_duo,duo_partner,is_content_shoot,internal_note,buffer_minutes,is_hidden)
 values(s.house_id,s.creator_id,v_new_date,s.starts_at,s.ends_at,s.studio_name,s.studio_address,s.description,s.slot_length_minutes,s.break_minutes,s.price_cents,s.currency,s.is_public,s.booking_enabled,s.room,s.is_duo,s.duo_partner,s.is_content_shoot,s.internal_note,s.buffer_minutes,s.is_hidden)
 returning id into v_id; return v_id;
end $$;
grant execute on function public.duplicate_my_studio_window(uuid,integer) to authenticated;

create or replace function public.get_platform_admin_metrics()
returns table(users bigint,houses bigint,messages bigint,tasks bigint,bookings bigint,storage_objects bigint)
language plpgsql security definer set search_path=public stable as $$
begin
 if not exists(select 1 from public.platform_admins a where a.user_id=auth.uid()) then raise exception 'Forbidden'; end if;
 return query select
  (select count(*) from public.profiles),
  (select count(*) from public.houses),
  (select count(*) from public.messages),
  (select count(*) from public.tasks),
  (select count(*) from public.slot_bookings),
  (select count(*) from storage.objects);
end $$;
grant execute on function public.get_platform_admin_metrics() to authenticated;

create or replace function public.log_security_event(p_event_type text,p_detail text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Nicht angemeldet.'; end if;
 insert into public.security_events(user_id,event_type,detail) values(auth.uid(),left(coalesce(p_event_type,'event'),80),left(coalesce(p_detail,''),1000)) returning id into v_id;
 return v_id;
end $$;
grant execute on function public.log_security_event(text,text) to authenticated;

notify pgrst,'reload schema';