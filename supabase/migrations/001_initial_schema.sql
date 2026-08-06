create extension if not exists pgcrypto;

create type public.user_role as enum ('dom','domina','sub','sklave');
create type public.relationship_style as enum ('exclusive','private_circle','community');
create type public.application_status as enum ('pending','accepted','rejected','withdrawn');
create type public.task_status as enum ('open','submitted','approved','rejected','cancelled');
create type public.order_status as enum ('pending','paid','refunded','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  role public.user_role not null,
  bio text not null default '',
  locale text not null default 'de' check (locale in ('de','en')),
  is_adult_confirmed boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  welcome_message text not null default '',
  relationship_style public.relationship_style not null default 'exclusive',
  applications_open boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique(owner_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique(house_id, applicant_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  house_key text not null unique,
  title text not null default 'Mitglied',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(house_id, member_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  assigned_to uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  status public.task_status not null default 'open',
  points integer not null default 0 check (points between 0 and 10000),
  due_at timestamptz,
  submitted_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  seller_id uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'EUR',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  amount_cents integer not null check (amount_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  status public.order_status not null default 'pending',
  payment_provider_ref text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index on public.houses(owner_id);
create index on public.applications(house_id, status);
create index on public.memberships(member_id, ended_at);
create index on public.tasks(assigned_to, status);
create index on public.messages(recipient_id, created_at desc);
create index on public.products(house_id, is_active);
create index on public.orders(buyer_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.applications enable row level security;
alter table public.memberships enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;
alter table public.agreements enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reports enable row level security;

create policy "Profile sind öffentlich lesbar" on public.profiles for select using (true);
create policy "Eigenes Profil anlegen" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Eigenes Profil bearbeiten" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Öffentliche Houses lesen" on public.houses for select using (is_public or owner_id = (select auth.uid()));
create policy "Eigenes House anlegen" on public.houses for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Eigenes House bearbeiten" on public.houses for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Bewerbungen beteiligter Personen lesen" on public.applications for select to authenticated using (
  applicant_id = (select auth.uid()) or exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
);
create policy "Eigene Bewerbung erstellen" on public.applications for insert to authenticated with check (applicant_id = (select auth.uid()));
create policy "House Owner entscheidet Bewerbung" on public.applications for update to authenticated using (
  applicant_id = (select auth.uid()) or exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
);

create policy "Mitgliedschaften beteiligter Personen lesen" on public.memberships for select to authenticated using (
  member_id = (select auth.uid()) or exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
);
create policy "House Owner verwaltet Mitgliedschaften" on public.memberships for all to authenticated using (
  exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
);

create policy "Aufgaben beteiligter Personen lesen" on public.tasks for select to authenticated using (
  assigned_to = (select auth.uid()) or created_by = (select auth.uid())
);
create policy "House Owner erstellt Aufgaben" on public.tasks for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Beteiligte aktualisieren Aufgaben" on public.tasks for update to authenticated using (
  assigned_to = (select auth.uid()) or created_by = (select auth.uid())
);

create policy "Nachrichten nur Beteiligte" on public.messages for select to authenticated using (
  sender_id = (select auth.uid()) or recipient_id = (select auth.uid())
);
create policy "Nachrichten als eigener Absender" on public.messages for insert to authenticated with check (sender_id = (select auth.uid()));
create policy "Empfänger markiert gelesen" on public.messages for update to authenticated using (recipient_id = (select auth.uid()));

create policy "Vereinbarungen nur House Beteiligte" on public.agreements for select to authenticated using (
  created_by = (select auth.uid()) or accepted_by = (select auth.uid()) or exists (select 1 from public.houses h where h.id = house_id and h.owner_id = (select auth.uid()))
);
create policy "Vereinbarungen erstellen" on public.agreements for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Vereinbarungen beteiligter Personen aktualisieren" on public.agreements for update to authenticated using (
  created_by = (select auth.uid()) or accepted_by = (select auth.uid())
);

create policy "Aktive Produkte öffentlich lesen" on public.products for select using (is_active or seller_id = (select auth.uid()));
create policy "Eigene Produkte verwalten" on public.products for all to authenticated using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));

create policy "Bestellungen beteiligter Personen lesen" on public.orders for select to authenticated using (
  buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
);

create policy "Eigene Meldung erstellen" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "Eigene Meldungen lesen" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role, is_adult_confirmed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Neues Mitglied'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'sub'),
    coalesce((new.raw_user_meta_data ->> 'is_adult_confirmed')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
