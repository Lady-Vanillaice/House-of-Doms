-- House of Doms: rollenbasierter Bewerbungsablauf
-- Subs/Sklaven senden Bewerbungen; Doms/Dominas entscheiden.

alter table public.applications
  add column if not exists subject text,
  add column if not exists experience text,
  add column if not exists availability text,
  add column if not exists boundaries text,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum ('pending', 'accepted', 'rejected', 'waitlist', 'withdrawn');
  end if;
end $$;

alter table public.applications
  alter column status drop default;

alter table public.applications
  alter column status type public.application_status
  using (
    case status::text
      when 'accepted' then 'accepted'::public.application_status
      when 'rejected' then 'rejected'::public.application_status
      when 'waitlist' then 'waitlist'::public.application_status
      when 'withdrawn' then 'withdrawn'::public.application_status
      else 'pending'::public.application_status
    end
  );

alter table public.applications
  alter column status set default 'pending'::public.application_status;

create or replace function public.is_dom_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role in ('dom', 'domme')
  );
$$;

create or replace function public.is_sub_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id and p.role in ('sub', 'slave')
  );
$$;

-- Nur ein Sub/Sklave darf eine eigene Bewerbung erstellen.
drop policy if exists "Applicants create applications" on public.applications;
create policy "Subs create own applications"
on public.applications for insert
to authenticated
with check (
  applicant_id = auth.uid()
  and public.is_sub_user(auth.uid())
  and status = 'pending'
);

-- Der Bewerber sieht seine Bewerbung; House-Owner sehen Bewerbungen an ihr House.
drop policy if exists "Applicants and owners read applications" on public.applications;
create policy "Applicants and owners read applications"
on public.applications for select
to authenticated
using (
  applicant_id = auth.uid()
  or exists (
    select 1 from public.houses h
    where h.id = applications.house_id and h.owner_id = auth.uid()
  )
);

-- Subs dürfen nur eine offene Bewerbung zurückziehen.
drop policy if exists "Applicants update applications" on public.applications;
create policy "Subs withdraw own pending applications"
on public.applications for update
to authenticated
using (
  applicant_id = auth.uid()
  and public.is_sub_user(auth.uid())
  and status = 'pending'
)
with check (
  applicant_id = auth.uid()
  and status = 'withdrawn'
);

-- Nur der Dom/die Domina des Houses darf entscheiden.
create policy "House owners decide applications"
on public.applications for update
to authenticated
using (
  exists (
    select 1 from public.houses h
    where h.id = applications.house_id
      and h.owner_id = auth.uid()
      and public.is_dom_user(auth.uid())
  )
)
with check (
  exists (
    select 1 from public.houses h
    where h.id = applications.house_id
      and h.owner_id = auth.uid()
      and public.is_dom_user(auth.uid())
  )
  and status in ('accepted', 'rejected', 'waitlist')
);

-- Bei Annahme: Mitgliedschaft und House Key automatisch erzeugen.
create or replace function public.accept_application(application_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.applications%rowtype;
begin
  select * into app from public.applications where id = application_id for update;
  if app.id is null then raise exception 'Application not found'; end if;
  if not exists (select 1 from public.houses h where h.id = app.house_id and h.owner_id = auth.uid()) then
    raise exception 'Only the House owner may accept this application';
  end if;
  if not public.is_dom_user(auth.uid()) then raise exception 'Dom role required'; end if;

  update public.applications
  set status = 'accepted', decision_note = note, decided_at = now(), updated_at = now()
  where id = application_id;

  insert into public.house_members (house_id, user_id, status, joined_at)
  values (app.house_id, app.applicant_id, 'active', now())
  on conflict (house_id, user_id) do update set status = 'active', joined_at = coalesce(public.house_members.joined_at, now());

  insert into public.house_keys (house_id, member_id, key_code, tier)
  select app.house_id, hm.id, 'HOD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), 'obsidian'
  from public.house_members hm
  where hm.house_id = app.house_id and hm.user_id = app.applicant_id
  on conflict (member_id) do nothing;
end;
$$;

grant execute on function public.accept_application(uuid, text) to authenticated;

-- Rollenregeln für die Folgefunktionen:
-- Nur Doms/Dominas erstellen Aufgaben für Mitglieder ihres Houses.
drop policy if exists "House owners create tasks" on public.tasks;
create policy "Doms create House tasks"
on public.tasks for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_dom_user(auth.uid())
  and exists (select 1 from public.houses h where h.id = tasks.house_id and h.owner_id = auth.uid())
);

-- Nur der zugewiesene Sub/Sklave darf seine Aufgabe als erledigt einreichen.
create policy "Assigned subs submit tasks"
on public.tasks for update
to authenticated
using (
  assigned_to = auth.uid()
  and public.is_sub_user(auth.uid())
)
with check (
  assigned_to = auth.uid()
  and status in ('submitted', 'done')
);

-- Studio-Tage und Slots bleiben ausschließlich beim House-Owner.
create policy "Doms manage studio days"
on public.studio_days for all
to authenticated
using (
  public.is_dom_user(auth.uid())
  and exists (select 1 from public.houses h where h.id = studio_days.house_id and h.owner_id = auth.uid())
)
with check (
  public.is_dom_user(auth.uid())
  and exists (select 1 from public.houses h where h.id = studio_days.house_id and h.owner_id = auth.uid())
);

-- Nur Subs/Sklaven können freie Session-Slots buchen.
create policy "Subs book available session slots"
on public.session_bookings for insert
to authenticated
with check (
  booked_by = auth.uid()
  and public.is_sub_user(auth.uid())
  and status = 'requested'
);
