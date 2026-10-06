-- End-to-end role and creator flow repair
-- Registration has offered "switch" for a long time; make the canonical profiles enum match the UI.
alter type public.user_role add value if not exists 'switch';

create or replace function public.is_creator_user(p_user uuid default auth.uid())
returns boolean language sql security definer set search_path=public stable as $$
 select exists(select 1 from public.profiles where id=p_user and role::text in ('dom','domina','switch'));
$$;
grant execute on function public.is_creator_user(uuid) to authenticated;

-- Generalize legacy site-builder authorization without renaming legacy tables/RPCs.
create or replace function public.save_my_domina_site(
 p_slug text,p_display_name text,p_headline text,p_about_text text,p_services_text text,p_rules_text text,
 p_pricing_text text,p_faq_text text,p_location_text text,p_contact_note text,p_theme text,
 p_instagram_url text,p_website_url text,p_is_published boolean
) returns public.domina_sites language plpgsql security definer set search_path=public as $$
declare v_slug text:=lower(trim(p_slug)); v_site public.domina_sites;
begin
 if not public.is_creator_user(auth.uid()) then raise exception 'Nur Creator können eine öffentliche Creator-Seite verwalten.'; end if;
 if length(v_slug)<3 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Ungültige URL.'; end if;
 insert into public.domina_sites(owner_id,slug,display_name,headline,about_text,services_text,rules_text,pricing_text,faq_text,location_text,contact_note,theme,email_alias,instagram_url,website_url,is_published)
 values(auth.uid(),v_slug,trim(p_display_name),coalesce(p_headline,''),coalesce(p_about_text,''),coalesce(p_services_text,''),coalesce(p_rules_text,''),coalesce(p_pricing_text,''),coalesce(p_faq_text,''),coalesce(p_location_text,''),coalesce(p_contact_note,''),coalesce(p_theme,'obsidian'),v_slug||'@house-of-doms.com',p_instagram_url,p_website_url,coalesce(p_is_published,false))
 on conflict(owner_id) do update set slug=excluded.slug,display_name=excluded.display_name,headline=excluded.headline,about_text=excluded.about_text,services_text=excluded.services_text,rules_text=excluded.rules_text,pricing_text=excluded.pricing_text,faq_text=excluded.faq_text,location_text=excluded.location_text,contact_note=excluded.contact_note,theme=excluded.theme,email_alias=excluded.email_alias,instagram_url=excluded.instagram_url,website_url=excluded.website_url,is_published=excluded.is_published,updated_at=now()
 returning * into v_site;
 return v_site;
end $$;
grant execute on function public.save_my_domina_site(text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean) to authenticated;

-- Keep profile_details role aligned with the canonical profile when users edit it.
create or replace function public.sync_my_profile_role(p_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_role not in ('dom','domina','sub','sklave','switch') then raise exception 'Ungültige Rolle.'; end if;
 update public.profiles set role=p_role::public.user_role,updated_at=now() where id=auth.uid();
 update public.profile_details set role=p_role,updated_at=now() where user_id=auth.uid();
end $$;
grant execute on function public.sync_my_profile_role(text) to authenticated;

notify pgrst,'reload schema';
