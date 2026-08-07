-- House of Doms — public Domina homepage pro
-- Hosted Supabase owns storage.objects via supabase_storage_admin.
-- Do not ALTER storage.objects or CREATE/DROP policies here: normal SQL migrations
-- can fail with ERROR 42501 "must be owner of table objects".
-- The bucket itself is created idempotently below. Upload permissions can be
-- configured later through Supabase Storage Policies. The homepage builder also
-- supports direct image URLs as a fallback until those policies are enabled.

alter table public.domina_sites
  add column if not exists hero_image_url text,
  add column if not exists booking_cta_label text not null default 'Session anfragen',
  add column if not exists booking_url text,
  add column if not exists testimonials jsonb not null default '[]'::jsonb,
  add column if not exists custom_domain text,
  add column if not exists show_memberships boolean not null default true,
  add column if not exists show_booking_cta boolean not null default true;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'domina-site-media',
  'domina-site-media',
  true,
  15728640,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public=true,
  file_size_limit=15728640,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

notify pgrst,'reload schema';
