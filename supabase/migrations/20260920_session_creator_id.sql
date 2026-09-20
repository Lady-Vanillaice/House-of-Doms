alter table public.session_requests
  add column if not exists creator_id uuid references public.profiles(id) on delete set null;

update public.session_requests sr
set creator_id = p.id
from public.profiles p
where sr.creator_id is null
  and lower(trim(sr.creator_name)) = lower(trim(p.display_name));

create index if not exists session_requests_creator_id_idx
on public.session_requests(creator_id);

drop policy if exists "creator_select_session_requests"
on public.session_requests;

drop policy if exists "creator_update_session_requests"
on public.session_requests;

create policy "creator_select_session_requests"
on public.session_requests
for select
to authenticated
using (creator_id = auth.uid());

create policy "creator_update_session_requests"
on public.session_requests
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());
