-- House Store foundation: products, purchases and access grants.
-- Payments are intentionally not processed here; a payment provider can be connected later.

create type public.store_product_type as enum ('digital','package','session');
create type public.store_product_status as enum ('draft','published','archived');
create type public.store_visibility as enum ('public','members','house');
create type public.store_order_status as enum ('pending','paid','cancelled','refunded');

create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'EUR',
  product_type public.store_product_type not null default 'digital',
  status public.store_product_status not null default 'draft',
  visibility public.store_visibility not null default 'public',
  featured boolean not null default false,
  delivery_note text,
  session_required boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status public.store_order_status not null default 'pending',
  provider_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.store_access_grants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.store_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_access_grants enable row level security;

create policy "published store products are discoverable"
on public.store_products for select
using (
  status = 'published'
  or created_by = auth.uid()
  or exists (select 1 from public.houses h where h.id = store_products.house_id and h.owner_id = auth.uid())
);

create policy "house owners manage store products"
on public.store_products for all
using (
  created_by = auth.uid()
  or exists (select 1 from public.houses h where h.id = store_products.house_id and h.owner_id = auth.uid())
)
with check (
  created_by = auth.uid()
  or exists (select 1 from public.houses h where h.id = store_products.house_id and h.owner_id = auth.uid())
);

create policy "buyers read own orders"
on public.store_orders for select
using (buyer_id = auth.uid());

create policy "buyers read own store access"
on public.store_access_grants for select
using (user_id = auth.uid());
