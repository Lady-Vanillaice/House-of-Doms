create table if not exists public.session_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  creator_name text not null,
  session_type text not null default 'Private Session',
  requested_date date not null,
  requested_time time not null,
  note text not null default '',
  status text not null default 'requested' check (status in ('requested','confirmed','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.session_requests enable row level security;

create policy "requesters can create session requests"
on public.session_requests for insert
to authenticated
with check (auth.uid() = requester_id);

create policy "requesters can read own session requests"
on public.session_requests for select
to authenticated
using (auth.uid() = requester_id);

create index if not exists session_requests_requester_idx on public.session_requests(requester_id);
create index if not exists session_requests_creator_idx on public.session_requests(creator_name);
create index if not exists session_requests_date_idx on public.session_requests(requested_date);
