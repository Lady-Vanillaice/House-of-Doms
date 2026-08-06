-- House settings and task-linked evidence
alter table public.houses
  add column if not exists welcome_message text,
  add column if not exists rules_text text,
  add column if not exists visibility text not null default 'private' check (visibility in ('private','application','public')),
  add column if not exists door_theme text not null default 'obsidian',
  add column if not exists applications_open boolean not null default true;

alter table public.tasks
  add column if not exists required_proof_types text[] not null default array[]::text[],
  add column if not exists release_at timestamptz not null default now(),
  add column if not exists calendar_teaser text not null default '1 Aufgabe geplant',
  add constraint tasks_required_proof_types_valid check (required_proof_types <@ array['text','image','video']::text[]),
  add constraint tasks_release_before_due check (due_at is null or release_at <= due_at);

create index if not exists tasks_release_at_idx on public.tasks(assigned_to, release_at);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  text_content text,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','changes_requested')),
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

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete cascade,
  title text,
  content text not null,
  visibility text not null default 'private' check (visibility in ('private','shared_with_dom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.task_submissions enable row level security;
alter table public.task_submission_files enable row level security;
alter table public.journal_entries enable row level security;

-- Doms always see tasks they created. Subs only receive full task rows at release time.
drop policy if exists "Aufgaben beteiligter Personen lesen" on public.tasks;
create policy "dom reads created tasks" on public.tasks for select to authenticated using (created_by = auth.uid());
create policy "sub reads released tasks" on public.tasks for select to authenticated using (assigned_to = auth.uid() and release_at <= now());

-- Safe calendar teaser view exposes no title or description before release.
create or replace view public.task_calendar_feed with (security_invoker=true) as
select id, house_id, assigned_to, release_at, due_at,
  case when release_at <= now() then title else calendar_teaser end as display_title,
  case when release_at <= now() then status::text else 'planned' end as display_status,
  (release_at <= now()) as is_released
from public.tasks;

grant select on public.task_calendar_feed to authenticated;

create policy "sub reads own submissions" on public.task_submissions for select using (submitted_by = auth.uid());
create policy "sub creates own submissions" on public.task_submissions for insert with check (
  submitted_by = auth.uid() and exists(select 1 from public.tasks t where t.id=task_id and t.assigned_to=auth.uid() and t.release_at<=now())
);
create policy "sub updates requested submissions" on public.task_submissions for update using (submitted_by = auth.uid() and status in ('draft','changes_requested'));
create policy "dom reads house submissions" on public.task_submissions for select using (
  exists(select 1 from public.tasks t join public.houses h on h.id=t.house_id where t.id=task_id and h.owner_id=auth.uid())
);
create policy "dom reviews house submissions" on public.task_submissions for update using (
  exists(select 1 from public.tasks t join public.houses h on h.id=t.house_id where t.id=task_id and h.owner_id=auth.uid())
);

create policy "submission files follow submission access" on public.task_submission_files for select using (
  exists(select 1 from public.task_submissions s where s.id=submission_id and (s.submitted_by=auth.uid() or exists(select 1 from public.tasks t join public.houses h on h.id=t.house_id where t.id=s.task_id and h.owner_id=auth.uid())))
);
create policy "sub uploads own evidence" on public.task_submission_files for insert with check (
  exists(select 1 from public.task_submissions s where s.id=submission_id and s.submitted_by=auth.uid())
);

create policy "author manages private journal" on public.journal_entries for all using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy "dom reads shared journal" on public.journal_entries for select using (
  visibility='shared_with_dom' and exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid())
);
