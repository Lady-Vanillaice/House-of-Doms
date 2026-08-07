-- House of Doms — one-step repair for chastity + chamber contact search

create table if not exists public.chastity_records (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  dom_id uuid not null references public.profiles(id) on delete cascade,
  sub_id uuid not null references public.profiles(id) on delete cascade,
  device_label text not null default 'Keuschheitskaefig',
  started_at timestamptz not null default now(),
  planned_review_at timestamptz,
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active','paused','ended')),
  notes text,
  end_reason text,
  emergency_release_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.chastity_checkins (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.chastity_records(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  comfort_status text not null check (comfort_status in ('okay','discomfort','emergency')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists chastity_records_sub_idx on public.chastity_records(sub_id,status,started_at desc);
create index if not exists chastity_records_dom_idx on public.chastity_records(dom_id,status,started_at desc);
create index if not exists chastity_checkins_record_idx on public.chastity_checkins(record_id,created_at desc);
alter table public.chastity_records enable row level security;
alter table public.chastity_checkins enable row level security;
drop policy if exists "chastity participants read records" on public.chastity_records;
create policy "chastity participants read records" on public.chastity_records for select to authenticated using (auth.uid() in (dom_id,sub_id));
drop policy if exists "chastity participants read checkins" on public.chastity_checkins;
create policy "chastity participants read checkins" on public.chastity_checkins for select to authenticated using (exists(select 1 from public.chastity_records r where r.id=record_id and auth.uid() in (r.dom_id,r.sub_id)));
grant select on public.chastity_records to authenticated;
grant select on public.chastity_checkins to authenticated;

create or replace function public.get_my_chastity_records()
returns table(id uuid, house_id uuid, dom_id uuid, sub_id uuid, counterpart_name text, device_label text, started_at timestamptz, planned_review_at timestamptz, ended_at timestamptz, status text, notes text, end_reason text, emergency_release_available boolean)
language sql security definer set search_path=public stable as $$
  select r.id,r.house_id,r.dom_id,r.sub_id,coalesce(nullif(p.display_name,''),'House-Mitglied'),r.device_label,r.started_at,r.planned_review_at,r.ended_at,r.status,r.notes,r.end_reason,r.emergency_release_available
  from public.chastity_records r join public.profiles p on p.id=case when r.dom_id=auth.uid() then r.sub_id else r.dom_id end
  where auth.uid() in (r.dom_id,r.sub_id) order by (r.status='active') desc,r.started_at desc;
$$;
grant execute on function public.get_my_chastity_records() to authenticated;

create or replace function public.get_chastity_checkins(p_record_id uuid)
returns table(id uuid,submitted_by uuid,submitter_name text,comfort_status text,note text,created_at timestamptz)
language sql security definer set search_path=public stable as $$
  select c.id,c.submitted_by,coalesce(nullif(p.display_name,''),'Mitglied'),c.comfort_status,c.note,c.created_at
  from public.chastity_checkins c join public.chastity_records r on r.id=c.record_id join public.profiles p on p.id=c.submitted_by
  where c.record_id=p_record_id and auth.uid() in (r.dom_id,r.sub_id) order by c.created_at desc;
$$;
grant execute on function public.get_chastity_checkins(uuid) to authenticated;

create or replace function public.start_chastity_record(p_sub_id uuid,p_device_label text default 'Keuschheitskaefig',p_planned_review_at timestamptz default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_house uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not public.is_dom_user(auth.uid()) then raise exception 'Nur Dom/Domina kann einen Keuschhaltungs-Zeitraum starten.'; end if;
  select h.id into v_house from public.houses h where h.owner_id=auth.uid() and exists(select 1 from public.memberships m where m.house_id=h.id and m.member_id=p_sub_id and m.ended_at is null) limit 1;
  if v_house is null then raise exception 'Der Sub/Sklave ist kein aktives Mitglied deines Houses.'; end if;
  if exists(select 1 from public.chastity_records r where r.dom_id=auth.uid() and r.sub_id=p_sub_id and r.status='active') then raise exception 'Es gibt bereits einen aktiven Keuschhaltungs-Zeitraum fuer diese Person.'; end if;
  insert into public.chastity_records(house_id,dom_id,sub_id,device_label,planned_review_at,notes)
  values(v_house,auth.uid(),p_sub_id,coalesce(nullif(trim(p_device_label),''),'Keuschheitskaefig'),p_planned_review_at,nullif(trim(coalesce(p_notes,'')),'')) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.start_chastity_record(uuid,text,timestamptz,text) to authenticated;

create or replace function public.submit_chastity_checkin(p_record_id uuid,p_comfort_status text,p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare r public.chastity_records; v_id uuid; v_status text:=lower(coalesce(p_comfort_status,''));
begin
  select * into r from public.chastity_records where id=p_record_id;
  if r.id is null then raise exception 'Eintrag nicht gefunden.'; end if;
  if auth.uid() not in (r.dom_id,r.sub_id) then raise exception 'Nicht erlaubt.'; end if;
  if v_status not in ('okay','discomfort','emergency') then raise exception 'Ungueltiger Check-in-Status.'; end if;
  insert into public.chastity_checkins(record_id,submitted_by,comfort_status,note) values(p_record_id,auth.uid(),v_status,nullif(trim(coalesce(p_note,'')),'')) returning id into v_id;
  if v_status='emergency' and r.status<>'ended' then update public.chastity_records set status='ended',ended_at=now(),end_reason='Notfall-Entriegelung / sofort beendet',updated_at=now() where id=p_record_id; end if;
  return v_id;
end; $$;
grant execute on function public.submit_chastity_checkin(uuid,text,text) to authenticated;

create or replace function public.end_chastity_record(p_record_id uuid,p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare r public.chastity_records;
begin
  select * into r from public.chastity_records where id=p_record_id;
  if r.id is null then raise exception 'Eintrag nicht gefunden.'; end if;
  if auth.uid() not in (r.dom_id,r.sub_id) then raise exception 'Nicht erlaubt.'; end if;
  update public.chastity_records set status='ended',ended_at=coalesce(ended_at,now()),end_reason=coalesce(nullif(trim(coalesce(p_reason,'')),''),'Beendet'),updated_at=now() where id=p_record_id;
end; $$;
grant execute on function public.end_chastity_record(uuid,text) to authenticated;

create or replace function public.search_chamber_contacts(p_query text default '')
returns table(user_id uuid, display_name text, role text)
language sql security definer set search_path=public stable as $$
  select p.id,p.display_name,p.role::text from public.profiles p
  where p.id<>auth.uid() and (coalesce(trim(p_query),'')='' or p.display_name ilike '%'||trim(p_query)||'%' or p.role::text ilike '%'||trim(p_query)||'%')
  order by p.display_name limit 30;
$$;
grant execute on function public.search_chamber_contacts(text) to authenticated;

notify pgrst, 'reload schema';

select object_name,ok from (values
 ('chastity_records',to_regclass('public.chastity_records') is not null),
 ('get_my_chastity_records',to_regprocedure('public.get_my_chastity_records()') is not null),
 ('start_chastity_record',to_regprocedure('public.start_chastity_record(uuid,text,timestamp with time zone,text)') is not null),
 ('search_chamber_contacts',to_regprocedure('public.search_chamber_contacts(text)') is not null)
) as checks(object_name,ok);
