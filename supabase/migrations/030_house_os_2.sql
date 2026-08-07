-- House of Doms — House OS 2.0
-- Consolidated upgrade: smart dashboard, Sub-Akten, task templates/series,
-- live applications, chamber links, cashbook metadata, homepage SEO/gallery,
-- delegated permissions and notification preferences.

-- ============================================================
-- TASKS: priority, points, recurrence + reusable templates
-- ============================================================
create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null,
  description text not null default '',
  required_proof_types text[] not null default array['text']::text[],
  priority text not null default 'normal' check(priority in ('low','normal','high','critical')),
  points integer not null default 0 check(points between 0 and 100000),
  default_release_delay_minutes integer not null default 0 check(default_release_delay_minutes between 0 and 525600),
  default_due_after_minutes integer check(default_due_after_minutes is null or default_due_after_minutes between 1 and 525600),
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists priority text not null default 'normal';
alter table public.tasks add column if not exists points integer not null default 0;
alter table public.tasks add column if not exists recurrence_rule text;
alter table public.tasks add column if not exists template_id uuid references public.task_templates(id) on delete set null;
alter table public.tasks add column if not exists series_parent_id uuid references public.tasks(id) on delete set null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='tasks_priority_check' and conrelid='public.tasks'::regclass) then
    alter table public.tasks add constraint tasks_priority_check check(priority in ('low','normal','high','critical'));
  end if;
  if not exists(select 1 from pg_constraint where conname='tasks_points_check' and conrelid='public.tasks'::regclass) then
    alter table public.tasks add constraint tasks_points_check check(points between 0 and 100000);
  end if;
end $$;

-- ============================================================
-- LIVE HOUSE APPLICATIONS
-- ============================================================
create table if not exists public.house_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  target_dom_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete cascade,
  subject text not null,
  message text not null,
  experience text not null default '',
  availability text not null default '',
  boundaries text not null default '',
  status text not null default 'pending' check(status in ('pending','accepted','rejected','waitlist','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists house_applications_dom_idx on public.house_applications(target_dom_id,status,created_at desc);
create index if not exists house_applications_applicant_idx on public.house_applications(applicant_id,status,created_at desc);

-- ============================================================
-- DOM-ONLY MEMBER DOSSIER NOTES
-- ============================================================
create table if not exists public.house_member_notes (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'general' check(category in ('general','session','task','development','boundary','admin')),
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists house_member_notes_member_idx on public.house_member_notes(house_id,member_id,created_at desc);

-- ============================================================
-- DELEGATED HOUSE PERMISSIONS
-- ============================================================
create table if not exists public.house_delegate_permissions (
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  can_manage_tasks boolean not null default false,
  can_manage_calendar boolean not null default false,
  can_manage_members boolean not null default false,
  can_manage_finances boolean not null default false,
  can_read_private_notes boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(house_id,user_id)
);

-- ============================================================
-- NOTIFICATION PREFERENCES / PROVIDER-INDEPENDENT FOUNDATION
-- ============================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  messages_enabled boolean not null default true,
  tasks_enabled boolean not null default true,
  bookings_enabled boolean not null default true,
  chastity_enabled boolean not null default true,
  tribute_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CHAMBER: reply/pin/session linking
-- ============================================================
alter table if exists public.messages add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
alter table if exists public.messages add column if not exists pinned_at timestamptz;
alter table if exists public.messages add column if not exists linked_booking_id uuid references public.slot_bookings(id) on delete set null;

-- CASHBOOK: tax, receipt, tags
alter table if exists public.dom_cashbook_entries add column if not exists vat_rate numeric(5,2) not null default 0;
alter table if exists public.dom_cashbook_entries add column if not exists receipt_path text;
alter table if exists public.dom_cashbook_entries add column if not exists tags text[] not null default array[]::text[];

-- DOMINA HOMEPAGE: SEO, accent + gallery
alter table if exists public.domina_sites add column if not exists seo_title text;
alter table if exists public.domina_sites add column if not exists seo_description text;
alter table if exists public.domina_sites add column if not exists accent_style text not null default 'classic';
alter table if exists public.domina_sites add column if not exists gallery_urls text[] not null default array[]::text[];

-- ============================================================
-- RLS
-- ============================================================
alter table public.task_templates enable row level security;
alter table public.house_applications enable row level security;
alter table public.house_member_notes enable row level security;
alter table public.house_delegate_permissions enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "owners manage task templates" on public.task_templates;
create policy "owners manage task templates" on public.task_templates for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "application participants read" on public.house_applications;
create policy "application participants read" on public.house_applications for select to authenticated
using(applicant_id=auth.uid() or target_dom_id=auth.uid());

drop policy if exists "applicants create applications" on public.house_applications;
create policy "applicants create applications" on public.house_applications for insert to authenticated
with check(applicant_id=auth.uid());

drop policy if exists "application participants update" on public.house_applications;
create policy "application participants update" on public.house_applications for update to authenticated
using(applicant_id=auth.uid() or target_dom_id=auth.uid());

drop policy if exists "house owners manage member notes" on public.house_member_notes;
create policy "house owners manage member notes" on public.house_member_notes for all to authenticated
using(exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid()))
with check(author_id=auth.uid() and exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid()));

drop policy if exists "house owners manage delegates" on public.house_delegate_permissions;
create policy "house owners manage delegates" on public.house_delegate_permissions for all to authenticated
using(exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid()))
with check(exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid()));

drop policy if exists "users manage notification preferences" on public.notification_preferences;
create policy "users manage notification preferences" on public.notification_preferences for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());

grant select,insert,update,delete on public.task_templates, public.house_applications, public.house_member_notes, public.house_delegate_permissions, public.notification_preferences to authenticated;

-- ============================================================
-- LIVE APPLICATION RPCS
-- ============================================================
create or replace function public.get_application_context()
returns table(user_id uuid,role text)
language sql security definer set search_path=public stable as $$
 select p.id,p.role::text from public.profiles p where p.id=auth.uid();
$$;
grant execute on function public.get_application_context() to authenticated;

create or replace function public.get_application_doms()
returns table(user_id uuid,display_name text)
language sql security definer set search_path=public stable as $$
 select p.id,p.display_name from public.profiles p
 where p.role::text in ('dom','domina') and p.id<>auth.uid()
 order by lower(coalesce(p.display_name,''));
$$;
grant execute on function public.get_application_doms() to authenticated;

create or replace function public.get_my_applications()
returns table(id uuid,applicant_id uuid,applicant_name text,target_dom_id uuid,dom_name text,house_id uuid,subject text,message text,experience text,availability text,boundaries text,status text,created_at timestamptz)
language sql security definer set search_path=public stable as $$
 select a.id,a.applicant_id,coalesce(ap.display_name,'Mitglied'),a.target_dom_id,coalesce(dp.display_name,'Dom/Domina'),a.house_id,a.subject,a.message,a.experience,a.availability,a.boundaries,a.status,a.created_at
 from public.house_applications a
 join public.profiles ap on ap.id=a.applicant_id
 join public.profiles dp on dp.id=a.target_dom_id
 where a.applicant_id=auth.uid() or a.target_dom_id=auth.uid()
 order by a.created_at desc;
$$;
grant execute on function public.get_my_applications() to authenticated;

create or replace function public.submit_house_application(p_target_dom_id uuid,p_subject text,p_message text,p_experience text default '',p_availability text default '',p_boundaries text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_role text; v_house uuid; v_id uuid;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if v_role not in ('sub','sklave') then raise exception 'Nur Sub/Sklave kann eine Bewerbung senden.'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_target_dom_id and p.role::text in ('dom','domina')) then raise exception 'Dom/Domina nicht gefunden.'; end if;
 select id into v_house from public.houses where owner_id=p_target_dom_id limit 1;
 if nullif(trim(coalesce(p_subject,'')),'') is null or nullif(trim(coalesce(p_message,'')),'') is null then raise exception 'Betreff und Nachricht sind erforderlich.'; end if;
 insert into public.house_applications(applicant_id,target_dom_id,house_id,subject,message,experience,availability,boundaries)
 values(auth.uid(),p_target_dom_id,v_house,trim(p_subject),trim(p_message),coalesce(p_experience,''),coalesce(p_availability,''),coalesce(p_boundaries,''))
 returning id into v_id; return v_id;
end $$;
grant execute on function public.submit_house_application(uuid,text,text,text,text,text) to authenticated;

create or replace function public.decide_house_application(p_application_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare a public.house_applications;
begin
 select * into a from public.house_applications where id=p_application_id and target_dom_id=auth.uid();
 if a.id is null then raise exception 'Bewerbung nicht gefunden.'; end if;
 if p_status not in ('accepted','rejected','waitlist') then raise exception 'Ungültige Entscheidung.'; end if;
 update public.house_applications set status=p_status,decided_at=now(),updated_at=now() where id=a.id;
 if p_status='accepted' then
   if a.house_id is null then select id into a.house_id from public.houses where owner_id=auth.uid() limit 1; end if;
   insert into public.memberships(house_id,member_id,joined_at)
   values(a.house_id,a.applicant_id,now())
   on conflict do nothing;
 end if;
end $$;
grant execute on function public.decide_house_application(uuid,text) to authenticated;

create or replace function public.withdraw_house_application(p_application_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.house_applications set status='withdrawn',updated_at=now()
 where id=p_application_id and applicant_id=auth.uid() and status in ('pending','waitlist');
 if not found then raise exception 'Bewerbung kann nicht zurückgezogen werden.'; end if;
end $$;
grant execute on function public.withdraw_house_application(uuid) to authenticated;

-- ============================================================
-- SMART DOM DASHBOARD
-- ============================================================
create or replace function public.get_dom_dashboard_metrics()
returns table(
  house_id uuid,
  member_count bigint,
  unread_messages bigint,
  open_tasks bigint,
  submitted_tasks bigint,
  upcoming_bookings bigint,
  active_chastity bigint,
  month_income_cents bigint,
  pending_applications bigint,
  unread_inquiries bigint
)
language plpgsql security definer set search_path=public stable as $$
declare v_house uuid;
begin
  select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
  if v_house is null then raise exception 'Kein eigenes House gefunden.'; end if;
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina')) then raise exception 'Forbidden'; end if;
  return query select
    v_house,
    (select count(*) from public.memberships m where m.house_id=v_house and m.ended_at is null),
    (select count(*) from public.messages m where m.recipient_id=auth.uid() and m.read_at is null),
    (select count(*) from public.tasks t where t.house_id=v_house and t.status::text='open'),
    (select count(*) from public.tasks t where t.house_id=v_house and t.status::text='submitted'),
    (select count(*) from public.slot_bookings b left join public.studio_days d on d.id=b.studio_day_id where b.house_id=v_house and b.status in ('requested','confirmed') and (d.event_date is null or d.event_date>=current_date)),
    (select count(*) from public.chastity_records c where c.house_id=v_house and c.status='active'),
    (select coalesce(sum(e.amount_cents),0)::bigint from public.dom_cashbook_entries e where e.owner_id=auth.uid() and e.entry_type='income' and e.status='completed' and e.payment_date>=date_trunc('month',current_date)::date),
    (select count(*) from public.house_applications a where a.target_dom_id=auth.uid() and a.status='pending'),
    (select count(*) from public.domina_site_inquiries i join public.domina_sites s on s.id=i.site_id where s.owner_id=auth.uid() and i.read_at is null);
end $$;
grant execute on function public.get_dom_dashboard_metrics() to authenticated;

-- ============================================================
-- MEMBER DOSSIERS
-- ============================================================
create or replace function public.get_house_member_dossiers()
returns table(
  user_id uuid, display_name text, role text, joined_at timestamptz,
  open_tasks bigint, approved_tasks bigint, submitted_tasks bigint,
  confirmed_bookings bigint, active_chastity boolean, last_message_at timestamptz
)
language plpgsql security definer set search_path=public stable as $$
declare v_house uuid;
begin
  select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
  if v_house is null then raise exception 'Forbidden'; end if;
  return query
  select p.id,p.display_name,p.role::text,m.joined_at,
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id and t.status::text='open'),
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id and t.status::text='approved'),
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id and t.status::text='submitted'),
    (select count(*) from public.slot_bookings b where b.house_id=v_house and b.requester_id=p.id and b.status in ('confirmed','completed')),
    exists(select 1 from public.chastity_records c where c.house_id=v_house and c.sub_id=p.id and c.status='active'),
    (select max(msg.created_at) from public.messages msg where (msg.sender_id=auth.uid() and msg.recipient_id=p.id) or (msg.sender_id=p.id and msg.recipient_id=auth.uid()))
  from public.memberships m join public.profiles p on p.id=m.member_id
  where m.house_id=v_house and m.ended_at is null
  order by lower(coalesce(p.display_name,''));
end $$;
grant execute on function public.get_house_member_dossiers() to authenticated;

create or replace function public.get_member_dossier(p_member_id uuid)
returns table(
  user_id uuid, display_name text, role text, joined_at timestamptz,
  task_total bigint, task_approved bigint, task_submitted bigint,
  booking_total bigint, active_chastity_id uuid, chastity_started_at timestamptz,
  last_checkin_at timestamptz, notes_count bigint
)
language plpgsql security definer set search_path=public stable as $$
declare v_house uuid;
begin
  select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
  if not exists(select 1 from public.memberships m where m.house_id=v_house and m.member_id=p_member_id and m.ended_at is null) then raise exception 'Mitglied nicht gefunden.'; end if;
  return query
  select p.id,p.display_name,p.role::text,m.joined_at,
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id),
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id and t.status::text='approved'),
    (select count(*) from public.tasks t where t.house_id=v_house and t.assigned_to=p.id and t.status::text='submitted'),
    (select count(*) from public.slot_bookings b where b.house_id=v_house and b.requester_id=p.id),
    c.id,c.started_at,
    (select max(ci.created_at) from public.chastity_checkins ci where ci.record_id=c.id),
    (select count(*) from public.house_member_notes n where n.house_id=v_house and n.member_id=p.id)
  from public.memberships m join public.profiles p on p.id=m.member_id
  left join lateral (select x.id,x.started_at from public.chastity_records x where x.house_id=v_house and x.sub_id=p.id and x.status='active' order by x.started_at desc limit 1) c on true
  where m.house_id=v_house and m.member_id=p_member_id and m.ended_at is null limit 1;
end $$;
grant execute on function public.get_member_dossier(uuid) to authenticated;

create or replace function public.add_member_note(p_member_id uuid,p_body text,p_category text default 'general',p_pinned boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_house uuid; v_id uuid;
begin
  select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
  if v_house is null or not exists(select 1 from public.memberships m where m.house_id=v_house and m.member_id=p_member_id and m.ended_at is null) then raise exception 'Nicht erlaubt.'; end if;
  if nullif(trim(coalesce(p_body,'')),'') is null then raise exception 'Notiz ist leer.'; end if;
  insert into public.house_member_notes(house_id,member_id,author_id,body,category,pinned)
  values(v_house,p_member_id,auth.uid(),trim(p_body),case when p_category in ('general','session','task','development','boundary','admin') then p_category else 'general' end,p_pinned)
  returning id into v_id; return v_id;
end $$;
grant execute on function public.add_member_note(uuid,text,text,boolean) to authenticated;

create or replace function public.get_member_notes(p_member_id uuid)
returns table(id uuid,category text,body text,pinned boolean,created_at timestamptz)
language sql security definer set search_path=public stable as $$
 select n.id,n.category,n.body,n.pinned,n.created_at
 from public.house_member_notes n join public.houses h on h.id=n.house_id
 where h.owner_id=auth.uid() and n.member_id=p_member_id
 order by n.pinned desc,n.created_at desc;
$$;
grant execute on function public.get_member_notes(uuid) to authenticated;

-- ============================================================
-- TASK TEMPLATE RPCS
-- ============================================================
create or replace function public.save_task_template(
 p_title text,p_description text default '',p_required_proof_types text[] default array['text']::text[],
 p_priority text default 'normal',p_points integer default 0,p_release_delay_minutes integer default 0,
 p_due_after_minutes integer default null,p_recurrence_rule text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_house uuid; v_id uuid;
begin
 select h.id into v_house from public.houses h where h.owner_id=auth.uid() limit 1;
 if v_house is null then raise exception 'Nur Dom/Domina.'; end if;
 if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Titel fehlt.'; end if;
 insert into public.task_templates(owner_id,house_id,title,description,required_proof_types,priority,points,default_release_delay_minutes,default_due_after_minutes,recurrence_rule)
 values(auth.uid(),v_house,trim(p_title),coalesce(p_description,''),coalesce(p_required_proof_types,array['text']::text[]),case when p_priority in ('low','normal','high','critical') then p_priority else 'normal' end,greatest(0,coalesce(p_points,0)),greatest(0,coalesce(p_release_delay_minutes,0)),p_due_after_minutes,nullif(trim(coalesce(p_recurrence_rule,'')),''))
 returning id into v_id; return v_id;
end $$;
grant execute on function public.save_task_template(text,text,text[],text,integer,integer,integer,text) to authenticated;

create or replace function public.create_task_from_template(p_template_id uuid,p_assigned_to uuid,p_release_at timestamptz default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare x public.task_templates; v_release timestamptz; v_due timestamptz; v_id uuid;
begin
 select * into x from public.task_templates where id=p_template_id and owner_id=auth.uid();
 if x.id is null then raise exception 'Vorlage nicht gefunden.'; end if;
 if not exists(select 1 from public.memberships m where m.house_id=x.house_id and m.member_id=p_assigned_to and m.ended_at is null) then raise exception 'Kein aktives House-Mitglied.'; end if;
 v_release:=coalesce(p_release_at,now()+make_interval(mins=>x.default_release_delay_minutes));
 v_due:=case when x.default_due_after_minutes is null then null else v_release+make_interval(mins=>x.default_due_after_minutes) end;
 insert into public.tasks(house_id,created_by,assigned_to,title,description,status,release_at,due_at,required_proof_types,calendar_teaser,priority,points,recurrence_rule,template_id)
 values(x.house_id,auth.uid(),p_assigned_to,x.title,x.description,'open',v_release,v_due,x.required_proof_types,'1 Aufgabe geplant',x.priority,x.points,x.recurrence_rule,x.id)
 returning id into v_id; return v_id;
end $$;
grant execute on function public.create_task_from_template(uuid,uuid,timestamptz) to authenticated;

-- ============================================================
-- NOTIFICATION PREFS HELPER
-- ============================================================
create or replace function public.get_my_notification_preferences()
returns public.notification_preferences language plpgsql security definer set search_path=public as $$
declare x public.notification_preferences;
begin
 insert into public.notification_preferences(user_id) values(auth.uid()) on conflict(user_id) do nothing;
 select * into x from public.notification_preferences where user_id=auth.uid(); return x;
end $$;
grant execute on function public.get_my_notification_preferences() to authenticated;

notify pgrst,'reload schema';