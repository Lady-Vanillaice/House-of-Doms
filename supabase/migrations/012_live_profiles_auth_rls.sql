-- Live profile auth wiring
alter table public.profile_details
  add constraint profile_details_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profile_details (
    user_id,
    display_name,
    role,
    boundaries,
    languages,
    contact_status,
    visibility
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'sub'),
    array['Jederzeit widerrufbar']::text[],
    array['DE']::text[],
    'open',
    'public'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

drop policy if exists "Public profiles are readable" on public.profile_details;
create policy "Public profiles are readable"
on public.profile_details
for select
using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profile_details;
create policy "Users can insert own profile"
on public.profile_details
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profile_details;
create policy "Users can update own profile"
on public.profile_details
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.profile_details;
create policy "Users can delete own profile"
on public.profile_details
for delete
to authenticated
using (auth.uid() = user_id);

-- Backfill profiles for users that registered before this migration.
insert into public.profile_details (user_id, display_name, role, boundaries, languages, contact_status, visibility)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'sub'),
  array['Jederzeit widerrufbar']::text[],
  array['DE']::text[],
  'open',
  'public'
from auth.users u
on conflict (user_id) do nothing;
