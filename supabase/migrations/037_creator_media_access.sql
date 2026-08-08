-- House of Doms — creator media access modes
-- Public, pay-per-view, or membership-only media per creator page.

create table if not exists public.creator_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid not null references public.domina_sites(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image','video','audio','file')),
  access_mode text not null default 'public' check (access_mode in ('public','ppv','members')),
  price_cents integer not null default 0 check (price_cents >= 0),
  categories text[] not null default array[]::text[],
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (access_mode <> 'ppv' or price_cents > 0)
);

create table if not exists public.creator_media_purchases (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.creator_media(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','refunded','cancelled')),
  price_cents integer not null check (price_cents >= 0),
  provider text not null default 'manual' check (provider in ('manual','stripe')),
  provider_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(media_id,buyer_id)
);

create index if not exists creator_media_site_idx on public.creator_media(site_id,is_published,sort_order,created_at desc);
create index if not exists creator_media_owner_idx on public.creator_media(owner_id,created_at desc);
create index if not exists creator_media_purchase_buyer_idx on public.creator_media_purchases(buyer_id,status);

alter table public.creator_media enable row level security;
alter table public.creator_media_purchases enable row level security;

drop policy if exists "owners manage creator media" on public.creator_media;
create policy "owners manage creator media" on public.creator_media for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "buyers read own creator media purchases" on public.creator_media_purchases;
create policy "buyers read own creator media purchases" on public.creator_media_purchases for select to authenticated
using(buyer_id=auth.uid());

drop policy if exists "owners read purchases for their media" on public.creator_media_purchases;
create policy "owners read purchases for their media" on public.creator_media_purchases for select to authenticated
using(exists(select 1 from public.creator_media m where m.id=media_id and m.owner_id=auth.uid()));

grant select,insert,update,delete on public.creator_media to authenticated;
grant select on public.creator_media_purchases to authenticated;

create or replace function public.save_creator_media(
  p_id uuid default null,
  p_media_url text default '',
  p_media_type text default 'image',
  p_title text default '',
  p_description text default '',
  p_access_mode text default 'public',
  p_price_cents integer default 0,
  p_categories text[] default array[]::text[],
  p_is_published boolean default false,
  p_sort_order integer default 0
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_site public.domina_sites; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  select * into v_site from public.domina_sites where owner_id=auth.uid() limit 1;
  if v_site.id is null then raise exception 'Bitte zuerst deine öffentliche Creator-Seite anlegen.'; end if;
  if nullif(trim(coalesce(p_media_url,'')),'') is null then raise exception 'Medien-Datei fehlt.'; end if;
  if p_media_type not in ('image','video','audio','file') then raise exception 'Ungültiger Medientyp.'; end if;
  if p_access_mode not in ('public','ppv','members') then raise exception 'Ungültige Freigabe.'; end if;
  if p_access_mode='ppv' and coalesce(p_price_cents,0)<=0 then raise exception 'Für Pay-per-View muss ein Preis größer als 0 gesetzt sein.'; end if;

  if p_id is null then
    insert into public.creator_media(owner_id,site_id,title,description,media_url,media_type,access_mode,price_cents,categories,is_published,sort_order)
    values(auth.uid(),v_site.id,trim(coalesce(p_title,'')),coalesce(p_description,''),trim(p_media_url),p_media_type,p_access_mode,case when p_access_mode='ppv' then coalesce(p_price_cents,0) else 0 end,coalesce(p_categories,array[]::text[]),coalesce(p_is_published,false),coalesce(p_sort_order,0))
    returning id into v_id;
  else
    update public.creator_media set
      title=trim(coalesce(p_title,'')),description=coalesce(p_description,''),media_url=trim(p_media_url),media_type=p_media_type,
      access_mode=p_access_mode,price_cents=case when p_access_mode='ppv' then coalesce(p_price_cents,0) else 0 end,
      categories=coalesce(p_categories,array[]::text[]),is_published=coalesce(p_is_published,false),sort_order=coalesce(p_sort_order,0),updated_at=now()
    where id=p_id and owner_id=auth.uid() returning id into v_id;
    if v_id is null then raise exception 'Medium nicht gefunden.'; end if;
  end if;
  return v_id;
end $$;
grant execute on function public.save_creator_media(uuid,text,text,text,text,text,integer,text[],boolean,integer) to authenticated;

create or replace function public.get_my_creator_media()
returns table(id uuid,title text,description text,media_url text,media_type text,access_mode text,price_cents integer,categories text[],is_published boolean,sort_order integer,created_at timestamptz)
language sql security definer set search_path=public stable as $$
  select m.id,m.title,m.description,m.media_url,m.media_type,m.access_mode,m.price_cents,m.categories,m.is_published,m.sort_order,m.created_at
  from public.creator_media m where m.owner_id=auth.uid()
  order by m.sort_order,m.created_at desc;
$$;
grant execute on function public.get_my_creator_media() to authenticated;

create or replace function public.get_creator_media_for_site(p_slug text)
returns table(id uuid,title text,description text,media_url text,media_type text,access_mode text,price_cents integer,categories text[],can_access boolean,purchase_status text)
language sql security definer set search_path=public stable as $$
  with ctx as (
    select ds.id as site_id, ds.owner_id,
      (select h.id from public.houses h where h.owner_id=ds.owner_id limit 1) as house_id
    from public.domina_sites ds
    where ds.slug=lower(p_slug) and ds.is_published=true
    limit 1
  ), rows as (
    select m.*,ctx.house_id,
      exists(select 1 from public.house_subscriptions hs where hs.house_id=ctx.house_id and hs.subscriber_id=auth.uid() and hs.status in ('trialing','active') and (hs.current_period_end is null or hs.current_period_end>now())) as has_membership,
      (select mp.status from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() limit 1) as my_purchase
    from public.creator_media m join ctx on ctx.site_id=m.site_id
    where m.is_published=true
  )
  select r.id,r.title,r.description,
    case when r.owner_id=auth.uid() or r.access_mode='public' or (r.access_mode='members' and r.has_membership) or (r.access_mode='ppv' and r.my_purchase='paid') then r.media_url else null end,
    r.media_type,r.access_mode,r.price_cents,r.categories,
    (r.owner_id=auth.uid() or r.access_mode='public' or (r.access_mode='members' and r.has_membership) or (r.access_mode='ppv' and r.my_purchase='paid')) as can_access,
    r.my_purchase
  from rows r order by r.sort_order,r.created_at desc;
$$;
grant execute on function public.get_creator_media_for_site(text) to anon,authenticated;

create or replace function public.request_creator_media_purchase(p_media_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare m public.creator_media; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  select * into m from public.creator_media where id=p_media_id and is_published=true and access_mode='ppv';
  if m.id is null then raise exception 'Dieser Inhalt ist nicht als Pay-per-View verfügbar.'; end if;
  if m.owner_id=auth.uid() then raise exception 'Eigene Inhalte müssen nicht gekauft werden.'; end if;
  insert into public.creator_media_purchases(media_id,buyer_id,status,price_cents,provider)
  values(m.id,auth.uid(),'pending_payment',m.price_cents,'manual')
  on conflict(media_id,buyer_id) do update set price_cents=excluded.price_cents
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.request_creator_media_purchase(uuid) to authenticated;

create or replace function public.activate_creator_media_purchase_manual(p_purchase_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.creator_media_purchases p set status='paid',paid_at=now(),provider='manual'
  where p.id=p_purchase_id and exists(select 1 from public.creator_media m where m.id=p.media_id and m.owner_id=auth.uid());
  if not found then raise exception 'Kauf nicht gefunden oder nicht erlaubt.'; end if;
end $$;
grant execute on function public.activate_creator_media_purchase_manual(uuid) to authenticated;

notify pgrst,'reload schema';