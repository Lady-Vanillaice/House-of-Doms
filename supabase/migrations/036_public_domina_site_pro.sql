-- House of Doms — public Domina homepage pro

alter table public.domina_sites
  add column if not exists hero_image_url text,
  add column if not exists booking_cta_label text not null default 'Session anfragen',
  add column if not exists booking_url text,
  add column if not exists testimonials jsonb not null default '[]'::jsonb,
  add column if not exists custom_domain text,
  add column if not exists show_memberships boolean not null default true,
  add column if not exists show_booking_cta boolean not null default true;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('domina-site-media','domina-site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=15728640,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

alter table storage.objects enable row level security;
drop policy if exists "domina site media public read" on storage.objects;
create policy "domina site media public read" on storage.objects for select using(bucket_id='domina-site-media');
drop policy if exists "domina site media owners insert" on storage.objects;
create policy "domina site media owners insert" on storage.objects for insert to authenticated with check(bucket_id='domina-site-media' and (storage.foldername(name))[1]=auth.uid()::text and public.is_dom_user(auth.uid()));
drop policy if exists "domina site media owners update" on storage.objects;
create policy "domina site media owners update" on storage.objects for update to authenticated using(bucket_id='domina-site-media' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='domina-site-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "domina site media owners delete" on storage.objects;
create policy "domina site media owners delete" on storage.objects for delete to authenticated using(bucket_id='domina-site-media' and (storage.foldername(name))[1]=auth.uid()::text);

notify pgrst,'reload schema';