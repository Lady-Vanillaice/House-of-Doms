-- House of Doms — erweiterter Keuschhaltungsbereich
alter table public.chastity_records add column if not exists cage_type text;
alter table public.chastity_records add column if not exists material text;
alter table public.chastity_records add column if not exists planned_end_at timestamptz;
alter table public.chastity_records add column if not exists checkin_interval_hours integer;
alter table public.chastity_records add column if not exists hygiene_break_notes text;
alter table public.chastity_records add column if not exists agreed_rules text;

-- Der Rueckgabetyp wurde gegenueber 023 erweitert. PostgreSQL kann den
-- OUT-/TABLE-Rueckgabetyp nicht per CREATE OR REPLACE aendern, daher zuerst droppen.
drop function if exists public.get_my_chastity_records();

create function public.get_my_chastity_records()
returns table(
  id uuid, house_id uuid, dom_id uuid, sub_id uuid, counterpart_name text,
  device_label text, cage_type text, material text, started_at timestamptz,
  planned_review_at timestamptz, planned_end_at timestamptz, ended_at timestamptz,
  status text, notes text, end_reason text, emergency_release_available boolean,
  checkin_interval_hours integer, hygiene_break_notes text, agreed_rules text
)
language sql security definer set search_path=public stable as $$
  select r.id,r.house_id,r.dom_id,r.sub_id,
    coalesce(nullif(p.display_name,''),'House-Mitglied') as counterpart_name,
    r.device_label,r.cage_type,r.material,r.started_at,r.planned_review_at,r.planned_end_at,
    r.ended_at,r.status,r.notes,r.end_reason,r.emergency_release_available,
    r.checkin_interval_hours,r.hygiene_break_notes,r.agreed_rules
  from public.chastity_records r
  join public.profiles p on p.id = case when r.dom_id=auth.uid() then r.sub_id else r.dom_id end
  where auth.uid() in (r.dom_id,r.sub_id)
  order by (r.status='active') desc,r.started_at desc;
$$;
grant execute on function public.get_my_chastity_records() to authenticated;

-- Alte 4-Parameter-Version aus 023 entfernen, damit PostgREST nur noch die
-- aktuelle erweiterte RPC-Signatur im Schema hat.
drop function if exists public.start_chastity_record(uuid,text,timestamptz,text);
drop function if exists public.start_chastity_record(uuid,text,timestamptz,text,text,text,timestamptz,integer,text,text);

create function public.start_chastity_record(
  p_sub_id uuid,
  p_device_label text default 'Keuschheitskaefig',
  p_planned_review_at timestamptz default null,
  p_notes text default null,
  p_cage_type text default null,
  p_material text default null,
  p_planned_end_at timestamptz default null,
  p_checkin_interval_hours integer default null,
  p_hygiene_break_notes text default null,
  p_agreed_rules text default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_house uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not public.is_dom_user(auth.uid()) then raise exception 'Nur Dom/Domina kann einen Keuschhaltungs-Zeitraum starten.'; end if;
  if p_checkin_interval_hours is not null and (p_checkin_interval_hours < 1 or p_checkin_interval_hours > 168) then
    raise exception 'Check-in-Intervall muss zwischen 1 und 168 Stunden liegen.';
  end if;
  if p_planned_end_at is not null and p_planned_end_at <= now() then raise exception 'Geplantes Ende muss in der Zukunft liegen.'; end if;
  select h.id into v_house from public.houses h
  where h.owner_id=auth.uid() and exists(
    select 1 from public.memberships m where m.house_id=h.id and m.member_id=p_sub_id and m.ended_at is null
  ) limit 1;
  if v_house is null then raise exception 'Der Sub/Sklave ist kein aktives Mitglied deines Houses.'; end if;
  if exists(select 1 from public.chastity_records r where r.dom_id=auth.uid() and r.sub_id=p_sub_id and r.status='active') then
    raise exception 'Es gibt bereits einen aktiven Keuschhaltungs-Zeitraum fuer diese Person.';
  end if;
  insert into public.chastity_records(
    house_id,dom_id,sub_id,device_label,cage_type,material,planned_review_at,planned_end_at,
    checkin_interval_hours,hygiene_break_notes,agreed_rules,notes
  ) values(
    v_house,auth.uid(),p_sub_id,coalesce(nullif(trim(p_device_label),''),'Keuschheitskaefig'),
    nullif(trim(coalesce(p_cage_type,'')),''),nullif(trim(coalesce(p_material,'')),''),
    p_planned_review_at,p_planned_end_at,p_checkin_interval_hours,
    nullif(trim(coalesce(p_hygiene_break_notes,'')),''),nullif(trim(coalesce(p_agreed_rules,'')),''),
    nullif(trim(coalesce(p_notes,'')),'')
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.start_chastity_record(uuid,text,timestamptz,text,text,text,timestamptz,integer,text,text) to authenticated;

notify pgrst, 'reload schema';
