-- Voluntary financial dynamics / tribute module
-- Payments are never forced; budgets are user-controlled and can be paused at any time.

create table if not exists public.financial_dynamics (
  id uuid primary key default gen_random_uuid(),
  dom_id uuid not null references public.profiles(id) on delete cascade,
  sub_id uuid not null references public.profiles(id) on delete cascade,
  monthly_limit_cents integer not null default 0 check (monthly_limit_cents >= 0),
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dom_id, sub_id)
);

create table if not exists public.tribute_requests (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.financial_dynamics(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  note text,
  status text not null default 'requested' check (status in ('requested','accepted','declined','cancelled','paid')),
  payment_provider_ref text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  paid_at timestamptz
);

alter table public.financial_dynamics enable row level security;
alter table public.tribute_requests enable row level security;

create policy "financial dynamics participants can read" on public.financial_dynamics
for select using (auth.uid() in (dom_id, sub_id));

create policy "sub controls budget and pause" on public.financial_dynamics
for update using (auth.uid() = sub_id) with check (auth.uid() = sub_id);

create policy "participants can read tribute requests" on public.tribute_requests
for select using (exists (select 1 from public.financial_dynamics d where d.id = dynamic_id and auth.uid() in (d.dom_id,d.sub_id)));

create policy "dom can create tribute requests" on public.tribute_requests
for insert with check (exists (select 1 from public.financial_dynamics d where d.id = dynamic_id and auth.uid() = d.dom_id and d.paused = false));

create policy "participants can update tribute status" on public.tribute_requests
for update using (exists (select 1 from public.financial_dynamics d where d.id = dynamic_id and auth.uid() in (d.dom_id,d.sub_id)));
