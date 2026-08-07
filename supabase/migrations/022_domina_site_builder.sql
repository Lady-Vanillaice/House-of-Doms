-- Domina public homepage builder
create table if not exists public.domina_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  headline text not null default '',
  about_text text not null default '',
  services_text text not null default '',
  rules_text text not null default '',
  pricing_text text not null default '',
  faq_text text not null default '',
  location_text text not null default '',
  contact_note text not null default '',
  theme text not null default 'crimson' check(theme in ('crimson','obsidian','gold')),
  email_alias text unique,
  email_status text not null default 'reserved' check(email_status in ('reserved','active','disabled')),
  instagram_url text,
  website_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domina_site_inquiries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.domina_sites(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.domina_sites enable row level security;
alter table public.domina_site_inquiries enable row level security;

drop policy if exists "owners manage domina sites" on public.domina_sites;
create policy "owners manage domina sites" on public.domina_sites for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());

drop policy if exists "published domina sites public" on public.domina_sites;
create policy "published domina sites public" on public.domina_sites for select
using(is_published=true or owner_id=auth.uid());

drop policy if exists "owners read site inquiries" on public.domina_site_inquiries;
create policy "owners read site inquiries" on public.domina_site_inquiries for select to authenticated
using(exists(select 1 from public.domina_sites s where s.id=site_id and s.owner_id=auth.uid()));

drop policy if exists "owners update site inquiries" on public.domina_site_inquiries;
create policy "owners update site inquiries" on public.domina_site_inquiries for update to authenticated
using(exists(select 1 from public.domina_sites s where s.id=site_id and s.owner_id=auth.uid()));

create or replace function public.save_my_domina_site(
  p_slug text,p_display_name text,p_headline text,p_about_text text,p_services_text text,p_rules_text text,
  p_pricing_text text,p_faq_text text,p_location_text text,p_contact_note text,p_theme text,
  p_instagram_url text,p_website_url text,p_is_published boolean
) returns public.domina_sites language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_role text; v_alias text; v_site public.domina_sites;
begin
  if v_uid is null then raise exception 'Bitte zuerst anmelden.'; end if;
  select role::text into v_role from public.profiles where id=v_uid;
  if coalesce(v_role,'') not in ('dom','domina') then raise exception 'Nur Dom/Domina kann eine öffentliche Homepage erstellen.'; end if;
  p_slug:=lower(regexp_replace(trim(coalesce(p_slug,'')),'[^a-z0-9-]+','-','g'));
  p_slug:=trim(both '-' from p_slug);
  if length(p_slug)<3 then raise exception 'Die URL muss mindestens 3 Zeichen haben.'; end if;
  v_alias:=p_slug||'@houseofdoms.de';
  insert into public.domina_sites(owner_id,slug,display_name,headline,about_text,services_text,rules_text,pricing_text,faq_text,location_text,contact_note,theme,email_alias,instagram_url,website_url,is_published,updated_at)
  values(v_uid,p_slug,trim(p_display_name),coalesce(p_headline,''),coalesce(p_about_text,''),coalesce(p_services_text,''),coalesce(p_rules_text,''),coalesce(p_pricing_text,''),coalesce(p_faq_text,''),coalesce(p_location_text,''),coalesce(p_contact_note,''),case when p_theme in ('crimson','obsidian','gold') then p_theme else 'crimson' end,v_alias,nullif(trim(coalesce(p_instagram_url,'')),''),nullif(trim(coalesce(p_website_url,'')),''),coalesce(p_is_published,false),now())
  on conflict(owner_id) do update set slug=excluded.slug,display_name=excluded.display_name,headline=excluded.headline,about_text=excluded.about_text,services_text=excluded.services_text,rules_text=excluded.rules_text,pricing_text=excluded.pricing_text,faq_text=excluded.faq_text,location_text=excluded.location_text,contact_note=excluded.contact_note,theme=excluded.theme,email_alias=excluded.email_alias,instagram_url=excluded.instagram_url,website_url=excluded.website_url,is_published=excluded.is_published,updated_at=now()
  returning * into v_site;
  return v_site;
end; $$;

grant execute on function public.save_my_domina_site(text,text,text,text,text,text,text,text,text,text,text,text,text,boolean) to authenticated;

create or replace function public.get_public_domina_site(p_slug text)
returns table(id uuid,slug text,display_name text,headline text,about_text text,services_text text,rules_text text,pricing_text text,faq_text text,location_text text,contact_note text,theme text,email_alias text,instagram_url text,website_url text)
language sql security definer set search_path=public stable as $$
 select s.id,s.slug,s.display_name,s.headline,s.about_text,s.services_text,s.rules_text,s.pricing_text,s.faq_text,s.location_text,s.contact_note,s.theme,s.email_alias,s.instagram_url,s.website_url
 from public.domina_sites s where s.slug=lower(p_slug) and s.is_published=true limit 1;
$$;
grant execute on function public.get_public_domina_site(text) to anon, authenticated;

create or replace function public.submit_domina_site_inquiry(p_slug text,p_sender_name text,p_sender_email text,p_message text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_site_id uuid; v_id uuid;
begin
 select id into v_site_id from public.domina_sites where slug=lower(p_slug) and is_published=true;
 if v_site_id is null then raise exception 'Homepage nicht gefunden.'; end if;
 if length(trim(coalesce(p_sender_name,'')))<2 or position('@' in coalesce(p_sender_email,''))<2 or length(trim(coalesce(p_message,'')))<5 then raise exception 'Bitte alle Kontaktfelder vollständig ausfüllen.'; end if;
 insert into public.domina_site_inquiries(site_id,sender_name,sender_email,message) values(v_site_id,trim(p_sender_name),trim(p_sender_email),trim(p_message)) returning id into v_id;
 return v_id;
end; $$;
grant execute on function public.submit_domina_site_inquiry(text,text,text,text) to anon, authenticated;

grant select,insert,update on public.domina_sites to authenticated;
grant select,update on public.domina_site_inquiries to authenticated;
notify pgrst, 'reload schema';