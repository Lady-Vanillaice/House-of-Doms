-- House of Doms — House OS 4.0 subscriptions

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  billing_interval text not null default 'month' check (billing_interval in ('month','quarter','year','one_time')),
  price_cents integer not null default 0 check (price_cents >= 0),
  trial_days integer not null default 0 check (trial_days between 0 and 90),
  max_members integer check (max_members is null or max_members > 0),
  invite_only boolean not null default false,
  is_active boolean not null default true,
  is_public boolean not null default true,
  benefits jsonb not null default '[]'::jsonb,
  benefit_keys text[] not null default array[]::text[],
  sort_order integer not null default 0,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.house_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  house_id uuid not null references public.houses(id) on delete cascade,
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending_payment' check (status in ('pending_payment','trialing','active','past_due','paused','cancelled','expired')),
  provider text not null default 'manual' check (provider in ('manual','stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists house_subscriptions_active_member_uq
  on public.house_subscriptions(house_id,subscriber_id)
  where status in ('pending_payment','trialing','active','past_due','paused');
create index if not exists subscription_plans_owner_idx on public.subscription_plans(owner_id,is_active,sort_order);
create index if not exists house_subscriptions_plan_idx on public.house_subscriptions(plan_id,status);

alter table public.subscription_plans enable row level security;
alter table public.house_subscriptions enable row level security;

drop policy if exists "owners manage subscription plans" on public.subscription_plans;
create policy "owners manage subscription plans" on public.subscription_plans for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "members read public subscription plans" on public.subscription_plans;
create policy "members read public subscription plans" on public.subscription_plans for select to authenticated
using(is_active=true and is_public=true);

drop policy if exists "subscription participants read" on public.house_subscriptions;
create policy "subscription participants read" on public.house_subscriptions for select to authenticated
using(subscriber_id=auth.uid() or exists(select 1 from public.houses h where h.id=house_id and h.owner_id=auth.uid()));

grant select,insert,update,delete on public.subscription_plans to authenticated;
grant select on public.house_subscriptions to authenticated;

create or replace function public.get_subscription_context()
returns table(user_id uuid,role text,house_id uuid)
language sql security definer set search_path=public stable as $$
 select p.id,p.role::text,
   case when p.role::text in ('dom','domina')
     then (select h.id from public.houses h where h.owner_id=p.id limit 1)
     else (select m.house_id from public.memberships m where m.member_id=p.id and m.ended_at is null order by m.joined_at desc limit 1)
   end
 from public.profiles p where p.id=auth.uid();
$$;
grant execute on function public.get_subscription_context() to authenticated;

create or replace function public.save_subscription_plan(
 p_id uuid default null,
 p_name text default '',
 p_tagline text default '',
 p_description text default '',
 p_billing_interval text default 'month',
 p_price_cents integer default 0,
 p_trial_days integer default 0,
 p_max_members integer default null,
 p_invite_only boolean default false,
 p_is_public boolean default true,
 p_benefits jsonb default '[]'::jsonb,
 p_benefit_keys text[] default array[]::text[],
 p_sort_order integer default 0
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_house uuid; v_id uuid;
begin
 if not public.is_dom_user(auth.uid()) then raise exception 'Nur Dom/Domina kann Abos verwalten.'; end if;
 select id into v_house from public.houses where owner_id=auth.uid() limit 1;
 if v_house is null then raise exception 'Kein eigenes House gefunden.'; end if;
 if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'Paketname fehlt.'; end if;
 if p_billing_interval not in ('month','quarter','year','one_time') then raise exception 'Ungültiger Abrechnungszeitraum.'; end if;
 if coalesce(p_price_cents,0)<0 then raise exception 'Preis ungültig.'; end if;
 if coalesce(p_trial_days,0) not between 0 and 90 then raise exception 'Testphase muss zwischen 0 und 90 Tagen liegen.'; end if;
 if p_id is null then
   insert into public.subscription_plans(house_id,owner_id,name,tagline,description,billing_interval,price_cents,trial_days,max_members,invite_only,is_public,benefits,benefit_keys,sort_order)
   values(v_house,auth.uid(),trim(p_name),coalesce(p_tagline,''),coalesce(p_description,''),p_billing_interval,coalesce(p_price_cents,0),coalesce(p_trial_days,0),p_max_members,coalesce(p_invite_only,false),coalesce(p_is_public,true),coalesce(p_benefits,'[]'::jsonb),coalesce(p_benefit_keys,array[]::text[]),coalesce(p_sort_order,0))
   returning id into v_id;
 else
   update public.subscription_plans set name=trim(p_name),tagline=coalesce(p_tagline,''),description=coalesce(p_description,''),billing_interval=p_billing_interval,price_cents=coalesce(p_price_cents,0),trial_days=coalesce(p_trial_days,0),max_members=p_max_members,invite_only=coalesce(p_invite_only,false),is_public=coalesce(p_is_public,true),benefits=coalesce(p_benefits,'[]'::jsonb),benefit_keys=coalesce(p_benefit_keys,array[]::text[]),sort_order=coalesce(p_sort_order,0),updated_at=now()
   where id=p_id and owner_id=auth.uid() returning id into v_id;
   if v_id is null then raise exception 'Paket nicht gefunden.'; end if;
 end if;
 return v_id;
end $$;
grant execute on function public.save_subscription_plan(uuid,text,text,text,text,integer,integer,integer,boolean,boolean,jsonb,text[],integer) to authenticated;

create or replace function public.toggle_subscription_plan(p_id uuid,p_active boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.subscription_plans set is_active=p_active,updated_at=now() where id=p_id and owner_id=auth.uid();
 if not found then raise exception 'Paket nicht gefunden.'; end if;
end $$;
grant execute on function public.toggle_subscription_plan(uuid,boolean) to authenticated;

create or replace function public.get_my_subscription_plans()
returns table(id uuid,name text,tagline text,description text,billing_interval text,price_cents integer,trial_days integer,max_members integer,invite_only boolean,is_active boolean,is_public boolean,benefits jsonb,benefit_keys text[],sort_order integer,active_members bigint,pending_members bigint,stripe_price_id text)
language sql security definer set search_path=public stable as $$
 select p.id,p.name,p.tagline,p.description,p.billing_interval,p.price_cents,p.trial_days,p.max_members,p.invite_only,p.is_active,p.is_public,p.benefits,p.benefit_keys,p.sort_order,
   (select count(*) from public.house_subscriptions s where s.plan_id=p.id and s.status in ('trialing','active')),
   (select count(*) from public.house_subscriptions s where s.plan_id=p.id and s.status='pending_payment'),
   p.stripe_price_id
 from public.subscription_plans p where p.owner_id=auth.uid() order by p.sort_order,p.price_cents;
$$;
grant execute on function public.get_my_subscription_plans() to authenticated;

create or replace function public.get_available_subscription_plans()
returns table(id uuid,house_id uuid,dom_name text,name text,tagline text,description text,billing_interval text,price_cents integer,trial_days integer,max_members integer,invite_only boolean,benefits jsonb,benefit_keys text[],active_members bigint,my_subscription_id uuid,my_status text)
language sql security definer set search_path=public stable as $$
 with my_house as (
   select m.house_id from public.memberships m where m.member_id=auth.uid() and m.ended_at is null order by m.joined_at desc limit 1
 )
 select p.id,p.house_id,coalesce(dp.display_name,'Dom/Domina'),p.name,p.tagline,p.description,p.billing_interval,p.price_cents,p.trial_days,p.max_members,p.invite_only,p.benefits,p.benefit_keys,
   (select count(*) from public.house_subscriptions x where x.plan_id=p.id and x.status in ('trialing','active')),
   s.id,s.status
 from public.subscription_plans p
 join my_house mh on mh.house_id=p.house_id
 join public.houses h on h.id=p.house_id
 join public.profiles dp on dp.id=h.owner_id
 left join public.house_subscriptions s on s.plan_id=p.id and s.subscriber_id=auth.uid() and s.status in ('pending_payment','trialing','active','past_due','paused')
 where p.is_active=true and p.is_public=true
 order by p.sort_order,p.price_cents;
$$;
grant execute on function public.get_available_subscription_plans() to authenticated;

create or replace function public.request_house_subscription(p_plan_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.subscription_plans; v_role text; v_id uuid; v_active bigint;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if v_role not in ('sub','sklave') then raise exception 'Nur Sub/Sklave kann ein Abo abschließen.'; end if;
 select * into p from public.subscription_plans where id=p_plan_id and is_active=true and is_public=true;
 if p.id is null then raise exception 'Abo-Paket nicht verfügbar.'; end if;
 if p.invite_only then raise exception 'Dieses Paket ist nur auf Einladung verfügbar.'; end if;
 if not exists(select 1 from public.memberships m where m.house_id=p.house_id and m.member_id=auth.uid() and m.ended_at is null) then raise exception 'Du bist kein aktives Mitglied dieses Houses.'; end if;
 if exists(select 1 from public.house_subscriptions s where s.house_id=p.house_id and s.subscriber_id=auth.uid() and s.status in ('pending_payment','trialing','active','past_due','paused')) then raise exception 'Du hast bereits ein laufendes oder ausstehendes Abo in diesem House.'; end if;
 select count(*) into v_active from public.house_subscriptions s where s.plan_id=p.id and s.status in ('trialing','active');
 if p.max_members is not null and v_active>=p.max_members then raise exception 'Dieses Paket ist aktuell ausgebucht.'; end if;
 insert into public.house_subscriptions(plan_id,house_id,subscriber_id,status,provider,trial_ends_at)
 values(p.id,p.house_id,auth.uid(),'pending_payment','manual',case when p.trial_days>0 then now()+(p.trial_days||' days')::interval else null end)
 returning id into v_id;
 return v_id;
end $$;
grant execute on function public.request_house_subscription(uuid) to authenticated;

create or replace function public.cancel_my_house_subscription(p_subscription_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.house_subscriptions set cancel_at_period_end=true,cancelled_at=coalesce(cancelled_at,now()),updated_at=now()
 where id=p_subscription_id and subscriber_id=auth.uid() and status in ('pending_payment','trialing','active','past_due','paused');
 if not found then raise exception 'Abo nicht gefunden.'; end if;
end $$;
grant execute on function public.cancel_my_house_subscription(uuid) to authenticated;

create or replace function public.activate_subscription_manual(p_subscription_id uuid,p_days integer default 30)
returns void language plpgsql security definer set search_path=public as $$
declare s public.house_subscriptions;
begin
 select * into s from public.house_subscriptions where id=p_subscription_id;
 if s.id is null or not exists(select 1 from public.houses h where h.id=s.house_id and h.owner_id=auth.uid()) then raise exception 'Nicht erlaubt.'; end if;
 update public.house_subscriptions set status='active',provider='manual',current_period_start=now(),current_period_end=now()+(greatest(1,coalesce(p_days,30))||' days')::interval,updated_at=now() where id=s.id;
end $$;
grant execute on function public.activate_subscription_manual(uuid,integer) to authenticated;

create or replace function public.has_subscription_benefit(p_benefit_key text)
returns boolean language sql security definer set search_path=public stable as $$
 select exists(
   select 1 from public.house_subscriptions s join public.subscription_plans p on p.id=s.plan_id
   where s.subscriber_id=auth.uid() and s.status in ('trialing','active') and p_benefit_keys @> array[p_benefit_key]
 );
$$;
grant execute on function public.has_subscription_benefit(text) to authenticated;

create or replace function public.get_public_subscription_plans_for_site(p_slug text)
returns table(name text,tagline text,description text,billing_interval text,price_cents integer,trial_days integer,max_members integer,benefits jsonb,active_members bigint)
language sql security definer set search_path=public stable as $$
 select p.name,p.tagline,p.description,p.billing_interval,p.price_cents,p.trial_days,p.max_members,p.benefits,
   (select count(*) from public.house_subscriptions s where s.plan_id=p.id and s.status in ('trialing','active'))
 from public.domina_sites ds
 join public.houses h on h.owner_id=ds.owner_id
 join public.subscription_plans p on p.house_id=h.id
 where ds.slug=lower(p_slug) and ds.is_published=true and p.is_active=true and p.is_public=true and p.invite_only=false
 order by p.sort_order,p.price_cents;
$$;
grant execute on function public.get_public_subscription_plans_for_site(text) to anon,authenticated;

notify pgrst,'reload schema';