-- Session management and notification center
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  dom_id uuid not null references public.profiles(id) on delete cascade,
  sub_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid references public.booking_slots(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  studio_name text not null default '',
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled','declined')),
  booking_note text not null default '',
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  house_id uuid references public.houses(id) on delete cascade,
  kind text not null check (kind in ('application','task','session','evidence','message','system')),
  title text not null,
  body text not null default '',
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sessions_dom_start_idx on public.sessions(dom_id, starts_at desc);
create index if not exists sessions_sub_start_idx on public.sessions(sub_id, starts_at desc);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(recipient_id, read_at) where read_at is null;

alter table public.sessions enable row level security;
alter table public.notifications enable row level security;

create policy "session participants read" on public.sessions for select to authenticated using (
  dom_id = auth.uid() or sub_id = auth.uid()
);
create policy "sub requests session" on public.sessions for insert to authenticated with check (
  sub_id = auth.uid()
);
create policy "dom manages session" on public.sessions for update to authenticated using (
  dom_id = auth.uid()
) with check (dom_id = auth.uid());
create policy "sub cancels own requested session" on public.sessions for update to authenticated using (
  sub_id = auth.uid() and status in ('requested','confirmed')
);

create policy "recipient reads notifications" on public.notifications for select to authenticated using (
  recipient_id = auth.uid()
);
create policy "recipient marks notifications read" on public.notifications for update to authenticated using (
  recipient_id = auth.uid()
) with check (recipient_id = auth.uid());
