-- House of Doms — production hardening pass
-- Unifies creator/switch permissions, repairs private messaging, connects moderation,
-- and prepares restricted creator media for private Storage delivery.

-- ---------------------------------------------------------------------------
-- CREATOR / SWITCH ROLE CONSISTENCY
-- ---------------------------------------------------------------------------
create or replace function public.is_creator_user(p_user uuid default auth.uid())
returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.profiles where id=p_user and role::text in ('dom','domina','switch'));
$$;
grant execute on function public.is_creator_user(uuid) to authenticated;

create or replace function public.is_dom_user(user_id uuid)
returns boolean language sql stable security definer set search_path=public as $
  select exists(select 1 from public.profiles p where p.id=user_id and p.role::text in ('dom','domina','switch'));
$;
create or replace function public.is_sub_user(user_id uuid)
returns boolean language sql stable security definer set search_path=public as $
  select exists(select 1 from public.profiles p where p.id=user_id and p.role::text in ('sub','sklave','switch'));
$;
grant execute on function public.is_dom_user(uuid) to authenticated;
grant execute on function public.is_sub_user(uuid) to authenticated;


create or replace function public.cashbook_is_dom()
returns boolean language sql security definer set search_path=public stable as $$
  select public.is_creator_user(auth.uid());
$$;
grant execute on function public.cashbook_is_dom() to authenticated;

create or replace function public.sync_my_cashbook_bookings()
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer:=0;
begin
  if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if not public.is_creator_user(auth.uid()) then raise exception 'Kassenbuch ist nur für Creator verfügbar.'; end if;

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
    appointment_date=excluded.appointment_date,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
    customer=excluded.customer,studio=excluded.studio,planned_amount_cents=excluded.planned_amount_cents,
    status=case when dom_cashbook_entries.status='completed' and dom_cashbook_entries.amount_cents>0 then dom_cashbook_entries.status else excluded.status end,
    note=coalesce(dom_cashbook_entries.note,excluded.note),updated_at=now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;
grant execute on function public.sync_my_cashbook_bookings() to authenticated;

create or replace function public.get_application_doms()
returns table(user_id uuid,display_name text)
language sql security definer set search_path=public stable as $$
  select p.id,p.display_name from public.profiles p
  where p.role::text in ('dom','domina','switch') and p.id<>auth.uid()
  order by lower(coalesce(p.display_name,''));
$$;
grant execute on function public.get_application_doms() to authenticated;

create or replace function public.submit_house_application(
 p_target_dom_id uuid,p_subject text,p_message text,p_experience text default '',
 p_availability text default '',p_boundaries text default ''
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_role text; v_house uuid; v_id uuid;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if v_role not in ('sub','sklave','switch') then raise exception 'Dieser Account kann keine Bewerbung senden.'; end if;
 if not exists(select 1 from public.profiles p where p.id=p_target_dom_id and p.role::text in ('dom','domina','switch')) then
   raise exception 'Creator nicht gefunden.';
 end if;
 select id into v_house from public.houses where owner_id=p_target_dom_id limit 1;
 if nullif(trim(coalesce(p_subject,'')),'') is null or nullif(trim(coalesce(p_message,'')),'') is null then
   raise exception 'Betreff und Nachricht sind erforderlich.';
 end if;
 insert into public.house_applications(applicant_id,target_dom_id,house_id,subject,message,experience,availability,boundaries)
 values(auth.uid(),p_target_dom_id,v_house,trim(p_subject),trim(p_message),coalesce(p_experience,''),coalesce(p_availability,''),coalesce(p_boundaries,''))
 returning id into v_id;
 return v_id;
end $$;
grant execute on function public.submit_house_application(uuid,text,text,text,text,text) to authenticated;

create or replace function public.get_subscription_context()
returns table(user_id uuid,role text,house_id uuid)
language sql security definer set search_path=public stable as $$
 select p.id,p.role::text,
   case when p.role::text in ('dom','domina','switch') and exists(select 1 from public.houses h where h.owner_id=p.id)
     then (select h.id from public.houses h where h.owner_id=p.id limit 1)
     else (select m.house_id from public.memberships m where m.member_id=p.id and m.ended_at is null order by m.joined_at desc limit 1)
   end
 from public.profiles p where p.id=auth.uid();
$$;
grant execute on function public.get_subscription_context() to authenticated;

create or replace function public.request_house_subscription(p_plan_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.subscription_plans; v_role text; v_id uuid; v_active bigint;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if v_role not in ('sub','sklave','switch') then raise exception 'Dieser Account kann keine Membership abschließen.'; end if;
 select * into p from public.subscription_plans where id=p_plan_id and is_active=true and is_public=true;
 if p.id is null then raise exception 'Membership nicht verfügbar.'; end if;
 if p.invite_only then raise exception 'Dieses Paket ist nur auf Einladung verfügbar.'; end if;
 if not exists(select 1 from public.memberships m where m.house_id=p.house_id and m.member_id=auth.uid() and m.ended_at is null) then
   raise exception 'Du bist kein aktives Mitglied dieses Houses.';
 end if;
 if exists(select 1 from public.house_subscriptions s where s.house_id=p.house_id and s.subscriber_id=auth.uid() and s.status in ('pending_payment','trialing','active','past_due','paused')) then
   raise exception 'Du hast bereits eine laufende oder ausstehende Membership in diesem House.';
 end if;
 select count(*) into v_active from public.house_subscriptions s where s.plan_id=p.id and s.status in ('trialing','active');
 if p.max_members is not null and v_active>=p.max_members then raise exception 'Dieses Paket ist aktuell ausgebucht.'; end if;
 insert into public.house_subscriptions(plan_id,house_id,subscriber_id,status,provider,trial_ends_at)
 values(p.id,p.house_id,auth.uid(),'pending_payment','manual',case when p.trial_days>0 then now()+(p.trial_days||' days')::interval else null end)
 returning id into v_id;
 return v_id;
end $$;
grant execute on function public.request_house_subscription(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PRIVATE MESSAGING REPAIR
-- ---------------------------------------------------------------------------
alter table public.messages alter column house_id drop not null;
alter table public.messages alter column body drop not null;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='messages_body_or_attachment_check' and conrelid='public.messages'::regclass) then
    alter table public.messages add constraint messages_body_or_attachment_check
      check (nullif(trim(coalesce(body,'')),'') is not null or attachment_path is not null or linked_task_id is not null or linked_booking_id is not null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- MODERATION
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin(p_user uuid default auth.uid())
returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.platform_admins where user_id=p_user);
$$;
grant execute on function public.is_platform_admin(uuid) to authenticated;

create or replace function public.get_platform_reports()
returns table(id uuid,reporter_name text,target_type text,target_id text,reason text,details text,status text,created_at timestamptz,reviewed_at timestamptz)
language plpgsql security definer set search_path=public stable as $$
begin
 if not public.is_platform_admin(auth.uid()) then raise exception 'Forbidden'; end if;
 return query
 select r.id,coalesce(p.display_name,'Mitglied'),r.target_type,r.target_id,r.reason,r.details,r.status,r.created_at,r.reviewed_at
 from public.platform_reports r left join public.profiles p on p.id=r.reporter_id
 order by case r.status when 'open' then 0 when 'reviewing' then 1 else 2 end,r.created_at desc;
end $$;
grant execute on function public.get_platform_reports() to authenticated;

create or replace function public.review_platform_report(p_report_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_platform_admin(auth.uid()) then raise exception 'Forbidden'; end if;
 if p_status not in ('open','reviewing','resolved','dismissed') then raise exception 'Ungültiger Status.'; end if;
 update public.platform_reports set status=p_status,reviewed_at=case when p_status in ('resolved','dismissed') then now() else reviewed_at end
 where id=p_report_id;
 if not found then raise exception 'Meldung nicht gefunden.'; end if;
end $$;
grant execute on function public.review_platform_report(uuid,text) to authenticated;

create or replace function public.submit_platform_report(p_target_type text,p_target_id text,p_reason text,p_details text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Bitte anmelden.'; end if;
 if p_target_type not in ('profile','content','message','session') then raise exception 'Ungültiges Meldeziel.'; end if;
 if nullif(trim(coalesce(p_target_id,'')),'') is null or nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Grund fehlt.'; end if;
 insert into public.platform_reports(reporter_id,target_type,target_id,reason,details)
 values(auth.uid(),p_target_type,left(trim(p_target_id),200),left(trim(p_reason),200),left(coalesce(p_details,''),4000))
 returning id into v_id;
 return v_id;
end $$;
grant execute on function public.submit_platform_report(text,text,text,text) to authenticated;

-- ---------------------------------------------------------------------------
-- PRIVATE CREATOR MEDIA
-- ---------------------------------------------------------------------------
alter table public.creator_media add column if not exists storage_bucket text;
alter table public.creator_media add column if not exists storage_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
 'creator-private-media','creator-private-media',false,104857600,
 array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4','audio/webm','audio/ogg']
)
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Public free creator content continues to use the public creator-site bucket.
update storage.buckets set file_size_limit=104857600,
 allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4','audio/webm','audio/ogg']
where id='domina-site-media';

-- Legacy PPV/membership rows point at a historically public bucket. Hide them until
-- the creator re-uploads the file into the new private bucket.
update public.creator_media
set is_published=false,updated_at=now()
where access_mode in ('ppv','members') and coalesce(storage_path,'')='';

-- Private creator media is intentionally not exposed through Storage RLS.
-- Uploads and signed delivery go through server routes using SUPABASE_SERVICE_ROLE_KEY.

create or replace function public.save_creator_media_secure(
 p_id uuid default null,p_media_url text default null,p_storage_bucket text default null,p_storage_path text default null,
 p_media_type text default 'image',p_title text default '',p_description text default '',
 p_access_mode text default 'public',p_price_cents integer default 0,p_categories text[] default array[]::text[],
 p_is_published boolean default false,p_sort_order integer default 0
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_site public.domina_sites; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Bitte zuerst anmelden.'; end if;
 if not public.is_creator_user(auth.uid()) then raise exception 'Nur Creator können Content veröffentlichen.'; end if;
 select * into v_site from public.domina_sites where owner_id=auth.uid() limit 1;
 if v_site.id is null then raise exception 'Bitte zuerst deine öffentliche Creator-Seite anlegen.'; end if;
 if p_media_type not in ('image','video','audio','file') then raise exception 'Ungültiger Medientyp.'; end if;
 if p_access_mode not in ('public','ppv','members') then raise exception 'Ungültige Freigabe.'; end if;
 if p_access_mode='ppv' and coalesce(p_price_cents,0)<=0 then raise exception 'Für Pay-per-View muss ein Preis größer als 0 gesetzt sein.'; end if;
 if p_access_mode='public' and nullif(trim(coalesce(p_media_url,'')),'') is null then raise exception 'Öffentliche Medien-URL fehlt.'; end if;
 if p_access_mode in ('ppv','members') and (p_storage_bucket<>'creator-private-media' or nullif(trim(coalesce(p_storage_path,'')),'') is null) then
   raise exception 'Geschützter Content muss im privaten Creator-Speicher liegen.';
 end if;
 if p_access_mode in ('ppv','members') and split_part(p_storage_path,'/',1)<>auth.uid()::text then raise exception 'Ungültiger Speicherpfad.'; end if;

 if p_id is null then
   insert into public.creator_media(owner_id,site_id,title,description,media_url,storage_bucket,storage_path,media_type,access_mode,price_cents,categories,is_published,sort_order)
   values(auth.uid(),v_site.id,trim(coalesce(p_title,'')),coalesce(p_description,''),coalesce(p_media_url,''),p_storage_bucket,p_storage_path,p_media_type,p_access_mode,
     case when p_access_mode='ppv' then coalesce(p_price_cents,0) else 0 end,coalesce(p_categories,array[]::text[]),coalesce(p_is_published,false),coalesce(p_sort_order,0))
   returning id into v_id;
 else
   update public.creator_media set title=trim(coalesce(p_title,'')),description=coalesce(p_description,''),
     media_url=coalesce(p_media_url,''),storage_bucket=p_storage_bucket,storage_path=p_storage_path,media_type=p_media_type,access_mode=p_access_mode,
     price_cents=case when p_access_mode='ppv' then coalesce(p_price_cents,0) else 0 end,categories=coalesce(p_categories,array[]::text[]),
     is_published=coalesce(p_is_published,false),sort_order=coalesce(p_sort_order,0),updated_at=now()
   where id=p_id and owner_id=auth.uid() returning id into v_id;
   if v_id is null then raise exception 'Medium nicht gefunden.'; end if;
 end if;
 return v_id;
end $$;
grant execute on function public.save_creator_media_secure(uuid,text,text,text,text,text,text,text,integer,text[],boolean,integer) to authenticated;

create or replace function public.get_creator_media_private_ref(p_media_id uuid)
returns table(storage_bucket text,storage_path text)
language sql security definer set search_path=public stable as $
 select m.storage_bucket,m.storage_path
 from public.creator_media m
 where m.id=p_media_id and m.is_published=true and m.storage_bucket='creator-private-media' and nullif(m.storage_path,'') is not null
 and (
   m.owner_id=auth.uid()
   or (m.access_mode='ppv' and exists(select 1 from public.creator_media_purchases p where p.media_id=m.id and p.buyer_id=auth.uid() and p.status='paid'))
   or (m.access_mode='members' and exists(
     select 1 from public.houses h join public.house_subscriptions s on s.house_id=h.id
     where h.owner_id=m.owner_id and s.subscriber_id=auth.uid() and s.status in ('trialing','active')
       and (s.current_period_end is null or s.current_period_end>now())
   ))
 );
$;
grant execute on function public.get_creator_media_private_ref(uuid) to authenticated;

drop function if exists public.get_creator_media_for_site_v2(text);
create function public.get_creator_media_for_site_v2(p_slug text)
returns table(id uuid,title text,description text,media_url text,storage_bucket text,storage_path text,media_type text,access_mode text,price_cents integer,categories text[],can_access boolean,purchase_status text)
language sql security definer set search_path=public stable as $$
 with ctx as (
  select ds.id site_id,ds.owner_id,(select h.id from public.houses h where h.owner_id=ds.owner_id limit 1) house_id
  from public.domina_sites ds where ds.slug=lower(p_slug) and ds.is_published=true limit 1
 ), rows as (
  select m.*,ctx.house_id,
   exists(select 1 from public.house_subscriptions hs where hs.house_id=ctx.house_id and hs.subscriber_id=auth.uid()
    and hs.status in ('trialing','active') and (hs.current_period_end is null or hs.current_period_end>now())) has_membership,
   (select mp.status from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() limit 1) my_purchase
  from public.creator_media m join ctx on ctx.site_id=m.site_id where m.is_published=true
 )
 select r.id,r.title,r.description,
  case when r.access_mode='public' then nullif(r.media_url,'') else null end,
  case when r.owner_id=auth.uid() or (r.access_mode='members' and r.has_membership) or (r.access_mode='ppv' and r.my_purchase='paid') then r.storage_bucket else null end,
  case when r.owner_id=auth.uid() or (r.access_mode='members' and r.has_membership) or (r.access_mode='ppv' and r.my_purchase='paid') then r.storage_path else null end,
  r.media_type,r.access_mode,r.price_cents,r.categories,
  (r.owner_id=auth.uid() or r.access_mode='public' or (r.access_mode='members' and r.has_membership) or (r.access_mode='ppv' and r.my_purchase='paid')),
  r.my_purchase
 from rows r order by r.sort_order,r.created_at desc;
$$;
grant execute on function public.get_creator_media_for_site_v2(text) to anon,authenticated;

drop function if exists public.get_public_creator_media_feed_v2();
create function public.get_public_creator_media_feed_v2()
returns table(id uuid,site_slug text,creator_name text,title text,description text,media_url text,storage_bucket text,storage_path text,media_type text,access_mode text,price_cents integer,categories text[],can_access boolean,purchase_status text)
language sql security definer set search_path=public stable as $$
 select m.id,ds.slug,ds.display_name,m.title,m.description,
   case when m.access_mode='public' then nullif(m.media_url,'') else null end,
   case when m.owner_id=auth.uid()
      or (m.access_mode='members' and exists(select 1 from public.houses h join public.house_subscriptions hs on hs.house_id=h.id where h.owner_id=m.owner_id and hs.subscriber_id=auth.uid() and hs.status in ('trialing','active') and (hs.current_period_end is null or hs.current_period_end>now())))
      or (m.access_mode='ppv' and exists(select 1 from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() and mp.status='paid'))
    then m.storage_bucket else null end,
   case when m.owner_id=auth.uid()
      or (m.access_mode='members' and exists(select 1 from public.houses h join public.house_subscriptions hs on hs.house_id=h.id where h.owner_id=m.owner_id and hs.subscriber_id=auth.uid() and hs.status in ('trialing','active') and (hs.current_period_end is null or hs.current_period_end>now())))
      or (m.access_mode='ppv' and exists(select 1 from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() and mp.status='paid'))
    then m.storage_path else null end,
   m.media_type,m.access_mode,m.price_cents,m.categories,
   (m.owner_id=auth.uid() or m.access_mode='public'
    or (m.access_mode='members' and exists(select 1 from public.houses h join public.house_subscriptions hs on hs.house_id=h.id where h.owner_id=m.owner_id and hs.subscriber_id=auth.uid() and hs.status in ('trialing','active') and (hs.current_period_end is null or hs.current_period_end>now())))
    or (m.access_mode='ppv' and exists(select 1 from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() and mp.status='paid'))),
   (select mp.status from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() limit 1)
 from public.creator_media m join public.domina_sites ds on ds.id=m.site_id
 where m.is_published=true and ds.is_published=true
 order by m.created_at desc;
$$;
grant execute on function public.get_public_creator_media_feed_v2() to anon,authenticated;

notify pgrst,'reload schema';
