-- House of Doms — product loop integration
-- Connect sessions, notifications, creator/member dashboards, cashbook and moderation without external providers.

alter table public.session_requests add column if not exists duration_minutes integer not null default 90 check (duration_minutes between 15 and 720);
alter table public.session_requests add column if not exists price_cents integer check (price_cents is null or price_cents >= 0);
alter table public.session_requests add column if not exists internal_note text not null default '';

create table if not exists public.creator_follows (
  creator_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(creator_id,follower_id),
  check(creator_id<>follower_id)
);
alter table public.creator_follows enable row level security;
drop policy if exists "follows readable" on public.creator_follows;
create policy "follows readable" on public.creator_follows for select to authenticated using(true);
drop policy if exists "members manage own follows" on public.creator_follows;
create policy "members manage own follows" on public.creator_follows for all to authenticated using(follower_id=auth.uid()) with check(follower_id=auth.uid());
grant select,insert,delete on public.creator_follows to authenticated;

create table if not exists public.platform_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 target_type text not null check(target_type in ('profile','content','message','session')),
 target_id text not null,
 reason text not null,
 details text not null default '',
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
alter table public.platform_reports enable row level security;
drop policy if exists "users submit reports" on public.platform_reports;
create policy "users submit reports" on public.platform_reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists "users read own reports" on public.platform_reports;
create policy "users read own reports" on public.platform_reports for select to authenticated using(reporter_id=auth.uid());
grant select,insert on public.platform_reports to authenticated;

create or replace function public.toggle_creator_follow(p_creator_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Bitte anmelden.'; end if;
 if exists(select 1 from public.creator_follows where creator_id=p_creator_id and follower_id=auth.uid()) then
   delete from public.creator_follows where creator_id=p_creator_id and follower_id=auth.uid(); return false;
 end if;
 insert into public.creator_follows(creator_id,follower_id) values(p_creator_id,auth.uid()); return true;
end $$;
grant execute on function public.toggle_creator_follow(uuid) to authenticated;

create or replace function public.get_member_hub()
returns table(kind text,item_id text,title text,subtitle text,status text,href text,event_at timestamptz)
language sql security definer set search_path=public stable as $$
 select 'session',s.id::text,coalesce(s.creator_name,'Creator'),coalesce(s.session_type,'Session'),s.status,'/sessions',s.requested_date::timestamp+s.requested_time
 from public.session_requests s where s.requester_id=auth.uid()
 union all
 select 'membership',hs.id::text,sp.name,coalesce(dp.display_name,'Creator'),hs.status,'/abonnements',hs.created_at
 from public.house_subscriptions hs join public.subscription_plans sp on sp.id=hs.plan_id join public.houses h on h.id=hs.house_id join public.profiles dp on dp.id=h.owner_id where hs.subscriber_id=auth.uid()
 union all
 select 'purchase',mp.id::text,cm.title,coalesce(ds.display_name,'Creator'),mp.status,'/store',mp.created_at
 from public.creator_media_purchases mp join public.creator_media cm on cm.id=mp.media_id join public.domina_sites ds on ds.id=cm.site_id where mp.buyer_id=auth.uid()
 order by event_at desc;
$$;
grant execute on function public.get_member_hub() to authenticated;

create or replace function public.get_creator_hub_metrics()
returns table(sessions_requested bigint,sessions_confirmed bigint,media_count bigint,active_members bigint,followers bigint,pending_sales bigint)
language sql security definer set search_path=public stable as $$
 select
 (select count(*) from public.session_requests where creator_id=auth.uid() and status='requested'),
 (select count(*) from public.session_requests where creator_id=auth.uid() and status='confirmed'),
 (select count(*) from public.creator_media where owner_id=auth.uid() and is_published=true),
 (select count(*) from public.house_subscriptions hs join public.houses h on h.id=hs.house_id where h.owner_id=auth.uid() and hs.status in ('trialing','active')),
 (select count(*) from public.creator_follows where creator_id=auth.uid()),
 (select count(*) from public.creator_media_purchases mp join public.creator_media cm on cm.id=mp.media_id where cm.owner_id=auth.uid() and mp.status='pending_payment');
$$;
grant execute on function public.get_creator_hub_metrics() to authenticated;

create or replace function public.get_my_financial_ledger()
returns table(kind text,reference_id uuid,label text,amount_cents integer,status text,occurred_at timestamptz)
language sql security definer set search_path=public stable as $$
 select 'content',mp.id,cm.title,mp.price_cents,mp.status,coalesce(mp.paid_at,mp.created_at)
 from public.creator_media_purchases mp join public.creator_media cm on cm.id=mp.media_id where cm.owner_id=auth.uid()
 union all
 select 'membership',hs.id,sp.name,sp.price_cents,hs.status,hs.created_at
 from public.house_subscriptions hs join public.subscription_plans sp on sp.id=hs.plan_id where sp.owner_id=auth.uid()
 union all
 select 'session',sr.id,coalesce(sr.session_type,'Session'),coalesce(sr.price_cents,0),sr.status,sr.created_at
 from public.session_requests sr where sr.creator_id=auth.uid()
 order by occurred_at desc;
$$;
grant execute on function public.get_my_financial_ledger() to authenticated;

notify pgrst,'reload schema';
