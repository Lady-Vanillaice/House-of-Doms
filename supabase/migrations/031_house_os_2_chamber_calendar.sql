-- House OS 2 — Chamber v2 + editable Domina calendar

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
 if p_attachment_type is not null and p_attachment_type not in ('image','video') then raise exception 'Ungültiger Anhang.'; end if;
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
 if coalesce(p_buffer_minutes,0)<0 or coalesce(p_buffer_minutes,0)>240 then raise exception 'Puffer muss zwischen 0 und 240 Minuten liegen.'; end if;
 update public.studio_days set event_date=p_event_date,starts_at=p_starts_at,ends_at=p_ends_at,studio_name=trim(p_studio_name),room=nullif(trim(coalesce(p_room,'')),''),is_duo=p_is_duo,duo_partner=case when p_is_duo then nullif(trim(coalesce(p_duo_partner,'')),'') end,is_content_shoot=p_is_content_shoot,internal_note=nullif(trim(coalesce(p_internal_note,'')),''),buffer_minutes=coalesce(p_buffer_minutes,45),is_hidden=p_is_hidden,is_public=not p_is_hidden,price_cents=p_price_cents,updated_at=now() where id=p_id;
end $$;
grant execute on function public.update_my_studio_window_advanced(uuid,date,time,time,text,text,boolean,text,boolean,text,integer,boolean,integer) to authenticated;

notify pgrst,'reload schema';