-- Live tasks + timed release + evidence submissions.
-- Safe after 019_unified_bootstrap_repair.sql.

alter table public.tasks
  add column if not exists required_proof_types text[] not null default array['text']::text[],
  add column if not exists release_at timestamptz not null default now(),
  add column if not exists calendar_teaser text not null default '1 Aufgabe geplant';

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  text_content text,
  status text not null default 'submitted' check (status in ('submitted','approved','changes_requested')),
  reviewer_feedback text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image','video')),
  original_name text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_assigned_release_idx on public.tasks(assigned_to, release_at);
create index if not exists task_submissions_task_idx on public.task_submissions(task_id, created_at desc);
create index if not exists task_submission_files_submission_idx on public.task_submission_files(submission_id);

alter table public.tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.task_submission_files enable row level security;

-- The creator always sees a task. The assignee only sees the full row after release.
drop policy if exists "dom reads created tasks" on public.tasks;
drop policy if exists "sub reads released tasks" on public.tasks;
drop policy if exists "Aufgaben beteiligter Personen lesen" on public.tasks;
create policy "task creator reads own tasks" on public.tasks
for select to authenticated using (created_by = auth.uid());
create policy "assignee reads released tasks" on public.tasks
for select to authenticated using (assigned_to = auth.uid() and release_at <= now());

-- All writes go through RPCs below.
drop policy if exists "House Owner erstellt Aufgaben" on public.tasks;
drop policy if exists "Doms create House tasks" on public.tasks;
drop policy if exists "Assigned subs submit tasks" on public.tasks;

-- Submission access.
drop policy if exists "sub reads own submissions" on public.task_submissions;
drop policy if exists "dom reads house submissions" on public.task_submissions;
drop policy if exists "sub creates own submissions" on public.task_submissions;
drop policy if exists "sub updates requested submissions" on public.task_submissions;
drop policy if exists "dom reviews house submissions" on public.task_submissions;
create policy "submission participants read" on public.task_submissions
for select to authenticated using (
  submitted_by = auth.uid()
  or exists (select 1 from public.tasks t where t.id = task_id and t.created_by = auth.uid())
);

-- File metadata follows submission access.
drop policy if exists "submission files follow submission access" on public.task_submission_files;
drop policy if exists "sub uploads own evidence" on public.task_submission_files;
create policy "submission file participants read" on public.task_submission_files
for select to authenticated using (
  exists (
    select 1 from public.task_submissions s
    join public.tasks t on t.id = s.task_id
    where s.id = submission_id
      and (s.submitted_by = auth.uid() or t.created_by = auth.uid())
  )
);

-- Private evidence bucket. Files are never public URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-evidence','task-evidence',false,52428800,array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upload only into the user's own top-level folder.
drop policy if exists "task evidence owner uploads" on storage.objects;
create policy "task evidence owner uploads" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'task-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "task evidence participants read" on storage.objects;
create policy "task evidence participants read" on storage.objects
for select to authenticated
using (
  bucket_id = 'task-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.task_submission_files f
      join public.task_submissions s on s.id = f.submission_id
      join public.tasks t on t.id = s.task_id
      where f.storage_path = name
        and t.created_by = auth.uid()
    )
  )
);

-- Current role + active house context.
create or replace function public.get_task_context()
returns table(user_id uuid, role text, house_id uuid)
language sql security definer set search_path = public stable
as $$
  select p.id, p.role::text,
    case when p.role::text in ('dom','domina')
      then (select h.id from public.houses h where h.owner_id=p.id limit 1)
      else (select m.house_id from public.memberships m where m.member_id=p.id and m.ended_at is null order by m.joined_at desc limit 1)
    end
  from public.profiles p where p.id=auth.uid();
$$;

grant execute on function public.get_task_context() to authenticated;

-- Members a Dom/Domina may assign tasks to.
create or replace function public.get_house_task_candidates()
returns table(user_id uuid, display_name text, role text)
language sql security definer set search_path = public stable
as $$
  select p.id, p.display_name, p.role::text
  from public.houses h
  join public.memberships m on m.house_id=h.id and m.ended_at is null
  join public.profiles p on p.id=m.member_id
  where h.owner_id=auth.uid()
    and p.role::text in ('sub','sklave')
  order by lower(p.display_name);
$$;

grant execute on function public.get_house_task_candidates() to authenticated;

-- Safe task feed: unreleased tasks are only teasers for the assigned Sub/Sklave.
create or replace function public.get_my_task_feed()
returns table(
  id uuid,
  house_id uuid,
  created_by uuid,
  assigned_to uuid,
  title text,
  description text,
  status text,
  release_at timestamptz,
  due_at timestamptz,
  required_proof_types text[],
  is_released boolean,
  calendar_teaser text
)
language sql security definer set search_path = public stable
as $$
  select
    t.id, t.house_id, t.created_by, t.assigned_to,
    case when t.created_by=auth.uid() or t.release_at<=now() then t.title else t.calendar_teaser end,
    case when t.created_by=auth.uid() or t.release_at<=now() then t.description else '' end,
    case when t.created_by=auth.uid() or t.release_at<=now() then t.status::text else 'planned' end,
    t.release_at, t.due_at,
    case when t.created_by=auth.uid() or t.release_at<=now() then t.required_proof_types else array[]::text[] end,
    (t.release_at<=now()),
    t.calendar_teaser
  from public.tasks t
  where t.created_by=auth.uid() or t.assigned_to=auth.uid()
  order by t.release_at desc, t.created_at desc;
$$;

grant execute on function public.get_my_task_feed() to authenticated;

create or replace function public.create_house_task(
  p_assigned_to uuid,
  p_title text,
  p_description text default '',
  p_release_at timestamptz default now(),
  p_due_at timestamptz default null,
  p_required_proof_types text[] default array['text']::text[],
  p_calendar_teaser text default '1 Aufgabe geplant'
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_house uuid;
  v_id uuid;
  v_role text;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  select role::text into v_role from public.profiles where id=auth.uid();
  if v_role not in ('dom','domina') then raise exception 'Nur Dom/Domina kann Aufgaben erstellen.'; end if;
  select id into v_house from public.houses where owner_id=auth.uid() limit 1;
  if v_house is null then raise exception 'Kein House gefunden.'; end if;
  if not exists(select 1 from public.memberships m where m.house_id=v_house and m.member_id=p_assigned_to and m.ended_at is null) then
    raise exception 'Der gewählte Sub/Sklave ist kein aktives House-Mitglied.';
  end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Titel fehlt.'; end if;
  if p_due_at is not null and p_due_at < p_release_at then raise exception 'Fälligkeit darf nicht vor der Freigabe liegen.'; end if;
  if not coalesce(p_required_proof_types,array[]::text[]) <@ array['text','image','video']::text[] then raise exception 'Ungültiger Nachweistyp.'; end if;

  insert into public.tasks(house_id,created_by,assigned_to,title,description,status,release_at,due_at,required_proof_types,calendar_teaser)
  values(v_house,auth.uid(),p_assigned_to,trim(p_title),coalesce(p_description,''),'open',p_release_at,p_due_at,coalesce(p_required_proof_types,array[]::text[]),coalesce(nullif(trim(p_calendar_teaser),''),'1 Aufgabe geplant'))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_house_task(uuid,text,text,timestamptz,timestamptz,text[],text) to authenticated;

create or replace function public.submit_task_evidence(
  p_task_id uuid,
  p_text_content text default null,
  p_storage_paths text[] default array[]::text[],
  p_media_types text[] default array[]::text[],
  p_original_names text[] default array[]::text[]
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_task public.tasks;
  v_submission uuid;
  i integer;
begin
  select * into v_task from public.tasks where id=p_task_id;
  if v_task.id is null then raise exception 'Aufgabe nicht gefunden.'; end if;
  if v_task.assigned_to<>auth.uid() then raise exception 'Diese Aufgabe ist dir nicht zugewiesen.'; end if;
  if v_task.release_at>now() then raise exception 'Diese Aufgabe ist noch nicht freigegeben.'; end if;
  if 'text'=any(v_task.required_proof_types) and nullif(trim(coalesce(p_text_content,'')),'') is null then raise exception 'Text-Nachweis erforderlich.'; end if;
  if coalesce(array_length(p_storage_paths,1),0) <> coalesce(array_length(p_media_types,1),0) then raise exception 'Dateidaten unvollständig.'; end if;
  if 'image'=any(v_task.required_proof_types) and not ('image'=any(coalesce(p_media_types,array[]::text[]))) then raise exception 'Bild-Nachweis erforderlich.'; end if;
  if 'video'=any(v_task.required_proof_types) and not ('video'=any(coalesce(p_media_types,array[]::text[]))) then raise exception 'Video-Nachweis erforderlich.'; end if;

  insert into public.task_submissions(task_id,submitted_by,text_content,status)
  values(p_task_id,auth.uid(),nullif(trim(coalesce(p_text_content,'')),''),'submitted')
  returning id into v_submission;

  if coalesce(array_length(p_storage_paths,1),0)>0 then
    for i in 1..array_length(p_storage_paths,1) loop
      insert into public.task_submission_files(submission_id,storage_path,media_type,original_name)
      values(v_submission,p_storage_paths[i],p_media_types[i],case when i<=coalesce(array_length(p_original_names,1),0) then p_original_names[i] else null end);
    end loop;
  end if;
  update public.tasks set status='submitted',updated_at=now() where id=p_task_id;
  return v_submission;
end;
$$;

grant execute on function public.submit_task_evidence(uuid,text,text[],text[],text[]) to authenticated;

create or replace function public.review_task_submission(
  p_submission_id uuid,
  p_decision text,
  p_feedback text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_task_id uuid;
begin
  if p_decision not in ('approved','changes_requested') then raise exception 'Ungültige Entscheidung.'; end if;
  select s.task_id into v_task_id
  from public.task_submissions s join public.tasks t on t.id=s.task_id
  where s.id=p_submission_id and t.created_by=auth.uid();
  if v_task_id is null then raise exception 'Einreichung nicht gefunden oder nicht erlaubt.'; end if;
  update public.task_submissions set status=p_decision,reviewer_feedback=p_feedback,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_submission_id;
  update public.tasks set status=case when p_decision='approved' then 'approved'::public.task_status else 'open'::public.task_status end,updated_at=now() where id=v_task_id;
end;
$$;

grant execute on function public.review_task_submission(uuid,text,text) to authenticated;

grant select on public.tasks, public.task_submissions, public.task_submission_files to authenticated;
notify pgrst, 'reload schema';
