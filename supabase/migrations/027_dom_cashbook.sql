-- House of Doms — Dom/Domina Kassenbuch
-- Übernimmt den Kern des Lady-Vanillaice-Kassenbuchs für House of Doms.
-- Zugriff ist ausschließlich für Dom/Domina und jeweils nur auf die eigenen Daten erlaubt.

create table if not exists public.dom_cashbook_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null default 'income' check (entry_type in ('income','expense')),
  source text not null default 'manual' check (source in ('manual','booking','money_slave','studio_rent','tribute','store')),
  booking_id uuid references public.slot_bookings(id) on delete set null,
  payment_date date,
  appointment_date date,
  starts_at time,
  ends_at time,
  customer text not null default '',
  studio text not null default '',
  category text,
  payment_method text,
  planned_amount_cents integer not null default 0 check (planned_amount_cents >= 0),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  status text not null default 'open' check (status in ('open','completed','cancelled','rescheduling')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dom_cashbook_booking_owner_uq
  on public.dom_cashbook_entries(owner_id,booking_id)
  where booking_id is not null;
create index if not exists dom_cashbook_owner_payment_idx on public.dom_cashbook_entries(owner_id,payment_date desc);
create index if not exists dom_cashbook_owner_appointment_idx on public.dom_cashbook_entries(owner_id,appointment_date desc);

alter table public.dom_cashbook_entries enable row level security;

drop policy if exists "doms read own cashbook" on public.dom_cashbook_entries;
create policy "doms read own cashbook" on public.dom_cashbook_entries
for select to authenticated
using (
  owner_id = auth.uid()
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina'))
);

drop policy if exists "doms insert own cashbook" on public.dom_cashbook_entries;
create policy "doms insert own cashbook" on public.dom_cashbook_entries
for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina'))
);

drop policy if exists "doms update own cashbook" on public.dom_cashbook_entries;
create policy "doms update own cashbook" on public.dom_cashbook_entries
for update to authenticated
using (
  owner_id = auth.uid()
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina'))
)
with check (owner_id = auth.uid());

drop policy if exists "doms delete own cashbook" on public.dom_cashbook_entries;
create policy "doms delete own cashbook" on public.dom_cashbook_entries
for delete to authenticated
using (
  owner_id = auth.uid()
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina'))
);

grant select,insert,update,delete on public.dom_cashbook_entries to authenticated;

create or replace function public.sync_my_cashbook_bookings()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_count integer:=0;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina')) then
    raise exception 'Kassenbuch ist nur für Dom/Domina verfügbar.';
  end if;

  insert into public.dom_cashbook_entries(
    owner_id,entry_type,source,booking_id,appointment_date,starts_at,ends_at,customer,studio,
    category,planned_amount_cents,status,note
  )
  select
    auth.uid(),'income','booking',b.id,d.event_date,
    coalesce(b.starts_at,s.starts_at,d.starts_at),coalesce(b.ends_at,s.ends_at,d.ends_at),
    coalesce(nullif(p.display_name,''),'House-Mitglied'),coalesce(nullif(d.studio_name,''),'Studio'),
    'Session',coalesce(b.price_cents,d.price_cents,0),
    case when b.status='cancelled' then 'cancelled'
         when b.status in ('confirmed','booked','completed') then 'completed'
         else 'open' end,
    nullif(b.dom_note,'')
  from public.slot_bookings b
  join public.houses h on h.id=b.house_id and h.owner_id=auth.uid()
  left join public.studio_days d on d.id=b.studio_day_id
  left join public.studio_slots s on s.id=b.slot_id
  left join public.profiles p on p.id=b.requester_id
  on conflict(owner_id,booking_id) where booking_id is not null do update set
    appointment_date=excluded.appointment_date,
    starts_at=excluded.starts_at,
    ends_at=excluded.ends_at,
    customer=excluded.customer,
    studio=excluded.studio,
    planned_amount_cents=excluded.planned_amount_cents,
    status=case when dom_cashbook_entries.status='completed' and dom_cashbook_entries.amount_cents>0 then dom_cashbook_entries.status else excluded.status end,
    note=coalesce(dom_cashbook_entries.note,excluded.note),
    updated_at=now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.sync_my_cashbook_bookings() to authenticated;

create or replace function public.cashbook_is_dom()
returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role::text in ('dom','domina'));
$$;
grant execute on function public.cashbook_is_dom() to authenticated;

notify pgrst, 'reload schema';
