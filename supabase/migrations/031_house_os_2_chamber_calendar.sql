-- House OS 2 — Chamber v2 + editable Domina calendar

-- Expand private chamber media bucket for voice notes and general files.
update storage.buckets
set file_size_limit=104857600,
    allowed_mime_types=array[
      'image/jpeg','image/png','image/webp','image/gif','image/heic',
      'video/mp4','video/quicktime','video/webm',
      'audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/webm','audio/ogg',
      'application/pdf','text/plain','application/zip'
    ]
where id='chamber-media';

create or replace function public.get_chamber_messages_v2(p_other_user uuid)
returns table(
 id uuid,sender_id uuid,recipient_id uuid,body text,attachment_type text,attachment_path text,
 linked_task_id uuid,linked_booking_id uuid,reply_to_id uuid,pinned_at timestamptz,created_at timestamptz
)
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
 update public.messages set read_at=coalesce(read_at,now()) where sender_id=p_other_user and recipient_id=auth.uid() and read_at is null;
 return query select m.id,m.sender_id,m.recipient_id,m.body,m.attachment_type,m.attachment_path,m.linked_task_id,m.linked_booking_id,m.reply_to_id,m.pinned_at,m.created_at
 from public.messages m
 where (m.sender_id=auth.uid() and m.recipient_id=p_other_user) or (m.sender_id=p_other_user and m.recipient_id=auth.uid())
 order by m.created_at asc;
end $$;
grant execute on function public.get_chamber_messages_v2(uuid) to authenticated;

create or replace function public.send_chamber_message_v2(
 p_recipient_id uuid,p_body text default null,p_attachment_type text default null,p_attachment_path text default null,
 p_linked_task_id uuid default null,p_linked_booking_id uuid default null,p_reply_to_id uuid default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
 if p_recipient_id is null or p_recipient_id=auth.uid() then raise exception 'Ungültiger Empfänger.'; end if;
 if nullif(trim(coalesce(p_body,'')),'') is null and p_attachment_path is null and p_linked_task_id is null and p_linked_booking_id is null then raise exception 'Nachricht ist leer.'; end if;
 if p_attachment_type is not null and p_attachment_type not in ('image','video','audio','file') then raise exception 'Ungültiger Anhang.'; end if;
 if p_reply_to_id is not null and not exists(select 1 from public.messages r where r.id=p_reply_to_id and auth.uid() in (r.sender_id,r.recipient_id)) then raise exception 'Antwortziel nicht erlaubt.'; end if;
 insert into public.messages(sender_id,recipient_id,body,attachment_type,attachment_path,linked_task_id,linked_booking_id,reply_to_id)
 values(auth.uid(),p_recipient_id,nullif(trim(coalesce(p_body,'')),''),p_attachment_type,p_attachment_path,p_linked_task_id,p_linked_booking_id,p_reply_to_id)
 returning id into v_id; return v_id;
end $$;
grant execute on function public.send_chamber_message_v2(uuid,text,text,text,uuid,uuid,uuid) to authenticated;

create or replace function public.toggle_chamber_message_pin(p_message_id uuid)
returns timestamptz language plpgsql security definer set search_path=public as $$
declare v_next timestamptz;
begin
 if not exists(select 1 from public.messages m where m.id=p_message_id and auth.uid() in (m.sender_id,m.recipient_id)) then raise exception 'Nachricht nicht gefunden.'; end if;
 update public.messages set pinned_at=case when pinned_at is null then now() else null end where id=p_message_id returning pinned_at into v_next;
 return v_next;
end $$;
grant execute on function public.toggle_chamber_message_pin(uuid) to authenticated;

create or replace function public.update_my_studio_window_advanced(
 p_id uuid,p_event_date date,p_starts_at time,p_ends_at time,p_studio_name text,p_room text default null,
 p_is_duo boolean default false,p_duo_partner text default null,p_is_content_shoot boolean default false,
 p_internal_note text default null,p_buffer_minutes integer default 45,p_is_hidden boolean default false,p_price_cents integer default null
) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.studio_days s join public.houses h on h.id=s.house_id where s.id=p_id and h.owner_id=auth.uid()) then raise exception 'Nicht erlaubt.'; end if;
 if p_ends_at<=p_starts_at then raise exception 'Ende muss nach Beginn liegen.'; end if;
 if exists(
   select 1 from public.studio_days s join public.houses h on h.id=s.house_id
   where h.owner_id=auth.uid() and s.id<>p_id and s.event_date=p_event_date
     and p_starts_at < s.ends_at and p_ends_at > s.starts_at
 ) then raise exception 'Dieses Zeitfenster überschneidet sich mit einer bestehenden Studiozeit.'; end if;
 if coalesce(p_buffer_minutes,0)<0 or coalesce(p_buffer_minutes,0)>240 then raise exception 'Puffer muss zwischen 0 und 240 Minuten liegen.'; end if;
 update public.studio_days set event_date=p_event_date,starts_at=p_starts_at,ends_at=p_ends_at,studio_name=trim(p_studio_name),room=nullif(trim(coalesce(p_room,'')),''),is_duo=p_is_duo,duo_partner=case when p_is_duo then nullif(trim(coalesce(p_duo_partner,'')),'') end,is_content_shoot=p_is_content_shoot,internal_note=nullif(trim(coalesce(p_internal_note,'')),''),buffer_minutes=coalesce(p_buffer_minutes,45),is_hidden=p_is_hidden,is_public=not p_is_hidden,price_cents=p_price_cents,updated_at=now() where id=p_id;
end $$;
grant execute on function public.update_my_studio_window_advanced(uuid,date,time,time,text,text,boolean,text,boolean,text,integer,boolean,integer) to authenticated;

create or replace function public.check_my_studio_window_conflicts(p_event_date date,p_starts_at time,p_ends_at time,p_exclude_id uuid default null)
returns table(id uuid,starts_at time,ends_at time,studio_name text)
language sql security definer set search_path=public stable as $$
 select s.id,s.starts_at,s.ends_at,s.studio_name
 from public.studio_days s join public.houses h on h.id=s.house_id
 where h.owner_id=auth.uid() and s.event_date=p_event_date and (p_exclude_id is null or s.id<>p_exclude_id)
   and p_starts_at < s.ends_at and p_ends_at > s.starts_at
 order by s.starts_at;
$$;
grant execute on function public.check_my_studio_window_conflicts(date,time,time,uuid) to authenticated;

-- Extend the private Apple/iPhone calendar feed with task deadlines.
create or replace function public.get_dom_calendar_feed(p_token uuid)
returns table(
  event_uid text,event_kind text,title text,description text,location text,
  event_date date,starts_at time,ends_at time,updated_at timestamptz
)
language sql security definer set search_path=public as $$
  with target_house as (
    select h.id,h.owner_id from public.houses h where h.calendar_feed_token=p_token limit 1
  ),
  studio_events as (
    select 'studio-'||s.id::text,'studio'::text,
      case when coalesce(s.is_hidden,false) then 'Studiozeit · intern' else 'Studiozeit · verfügbar' end,
      concat_ws(E'\n',case when s.is_duo then 'Duo-Session'||case when nullif(s.duo_partner,'') is not null then ' mit '||s.duo_partner else '' end end,case when s.is_content_shoot then 'Content-Dreh' end,case when nullif(s.internal_note,'') is not null then 'Interne Notiz: '||s.internal_note end,'Puffer: '||coalesce(s.buffer_minutes,45)::text||' Min.'),
      concat_ws(' · ',nullif(s.studio_name,''),nullif(s.room,'')),s.event_date,s.starts_at,s.ends_at,coalesce(s.updated_at,s.created_at,now())
    from public.studio_days s join target_house h on h.id=s.house_id
  ),
  booking_events as (
    select 'booking-'||b.id::text,'booking'::text,'Session · '||coalesce(nullif(p.display_name,''),'Sub/Sklave'),
      concat_ws(E'\n',case when nullif(b.note,'') is not null then 'Notiz: '||b.note end,case when nullif(b.dom_note,'') is not null then 'Dom-Notiz: '||b.dom_note end,case when s.is_duo then 'Duo-Session'||case when nullif(s.duo_partner,'') is not null then ' mit '||s.duo_partner else '' end end,case when s.is_content_shoot then 'Content-Dreh' end),
      concat_ws(' · ',nullif(s.studio_name,''),nullif(s.room,'')),s.event_date,b.starts_at,b.ends_at,coalesce(b.confirmed_at,b.requested_at,now())
    from public.slot_bookings b join target_house h on h.id=b.house_id join public.studio_days s on s.id=b.studio_day_id left join public.profiles p on p.id=b.requester_id
    where b.status in ('confirmed','completed') and b.starts_at is not null and b.ends_at is not null
  ),
  task_events as (
    select 'task-'||t.id::text,'task'::text,'Aufgabe · '||t.title,
      concat_ws(E'\n',nullif(t.description,''),'Status: '||t.status::text,'Priorität: '||coalesce(t.priority,'normal'),'Punkte: '||coalesce(t.points,0)::text),
      'House of Doms'::text,
      (t.due_at at time zone 'Europe/Berlin')::date,
      (t.due_at at time zone 'Europe/Berlin')::time,
      ((t.due_at + interval '30 minutes') at time zone 'Europe/Berlin')::time,
      coalesce(t.updated_at,t.created_at,now())
    from public.tasks t join target_house h on h.id=t.house_id
    where t.due_at is not null
  )
  select * from studio_events
  union all select * from booking_events
  union all select * from task_events
  order by event_date,starts_at;
$$;
grant execute on function public.get_dom_calendar_feed(uuid) to anon,authenticated;

notify pgrst,'reload schema';