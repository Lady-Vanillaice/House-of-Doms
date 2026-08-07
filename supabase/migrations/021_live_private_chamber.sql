-- House of Doms — live private chamber messaging

alter table public.messages add column if not exists recipient_id uuid references public.profiles(id) on delete cascade;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists linked_task_id uuid references public.tasks(id) on delete set null;
alter table public.messages add column if not exists read_at timestamptz;

alter table public.messages enable row level security;

drop policy if exists "chamber participants read messages" on public.messages;
create policy "chamber participants read messages" on public.messages
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "chamber users send messages" on public.messages;
create policy "chamber users send messages" on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and recipient_id is not null
  and recipient_id <> auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = recipient_id
  )
);

drop policy if exists "recipient marks chamber messages read" on public.messages;
create policy "recipient marks chamber messages read" on public.messages
for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

grant select, insert, update on public.messages to authenticated;

create or replace function public.get_chamber_contacts()
returns table(user_id uuid, display_name text, role text, last_message text, unread_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  with my_houses as (
    select h.id, h.owner_id
    from public.houses h
    where h.owner_id = auth.uid()
    union
    select h.id, h.owner_id
    from public.memberships m
    join public.houses h on h.id = m.house_id
    where m.member_id = auth.uid() and m.ended_at is null
  ), contacts as (
    select distinct case when mh.owner_id = auth.uid() then m.member_id else mh.owner_id end as user_id
    from my_houses mh
    left join public.memberships m on m.house_id = mh.id and m.ended_at is null
    where case when mh.owner_id = auth.uid() then m.member_id else mh.owner_id end is not null
      and case when mh.owner_id = auth.uid() then m.member_id else mh.owner_id end <> auth.uid()
    union
    select distinct case when msg.sender_id = auth.uid() then msg.recipient_id else msg.sender_id end
    from public.messages msg
    where auth.uid() in (msg.sender_id, msg.recipient_id)
  )
  select p.id,
         p.display_name,
         p.role::text,
         coalesce((select coalesce(m.body, case when m.attachment_type='image' then 'Bild' when m.attachment_type='video' then 'Video' when m.linked_task_id is not null then 'Aufgabe' else 'Nachricht' end)
                   from public.messages m
                   where (m.sender_id=auth.uid() and m.recipient_id=p.id) or (m.sender_id=p.id and m.recipient_id=auth.uid())
                   order by m.created_at desc limit 1),'Noch keine Nachrichten') as last_message,
         (select count(*) from public.messages m where m.sender_id=p.id and m.recipient_id=auth.uid() and m.read_at is null) as unread_count
  from contacts c
  join public.profiles p on p.id=c.user_id
  order by p.display_name;
$$;

grant execute on function public.get_chamber_contacts() to authenticated;

create or replace function public.get_chamber_messages(p_other_user uuid)
returns table(id uuid, sender_id uuid, recipient_id uuid, body text, attachment_type text, attachment_path text, linked_task_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  update public.messages set read_at=coalesce(read_at,now()) where sender_id=p_other_user and recipient_id=auth.uid() and read_at is null;
  return query
  select m.id,m.sender_id,m.recipient_id,m.body,m.attachment_type,m.attachment_path,m.linked_task_id,m.created_at
  from public.messages m
  where (m.sender_id=auth.uid() and m.recipient_id=p_other_user) or (m.sender_id=p_other_user and m.recipient_id=auth.uid())
  order by m.created_at asc;
end;
$$;

grant execute on function public.get_chamber_messages(uuid) to authenticated;

create or replace function public.send_chamber_message(p_recipient_id uuid, p_body text default null, p_attachment_type text default null, p_attachment_path text default null, p_linked_task_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if p_recipient_id is null or p_recipient_id=auth.uid() then raise exception 'Ungültiger Empfänger.'; end if;
  if nullif(trim(coalesce(p_body,'')),'') is null and p_attachment_path is null and p_linked_task_id is null then raise exception 'Nachricht ist leer.'; end if;
  if p_attachment_type is not null and p_attachment_type not in ('image','video') then raise exception 'Ungültiger Anhang.'; end if;
  insert into public.messages(sender_id,recipient_id,body,attachment_type,attachment_path,linked_task_id)
  values(auth.uid(),p_recipient_id,nullif(trim(coalesce(p_body,'')),''),p_attachment_type,p_attachment_path,p_linked_task_id)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.send_chamber_message(uuid,text,text,text,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chamber-media','chamber-media',false,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "chamber media upload own folder" on storage.objects;
create policy "chamber media upload own folder" on storage.objects
for insert to authenticated
with check(bucket_id='chamber-media' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "chamber media read authenticated" on storage.objects;
create policy "chamber media read authenticated" on storage.objects
for select to authenticated
using(bucket_id='chamber-media');

grant usage on schema public to authenticated;
notify pgrst, 'reload schema';
