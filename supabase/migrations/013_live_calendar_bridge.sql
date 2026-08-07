-- Live-Kalender Bridge: bestehende Auth-Nutzer in public.profiles spiegeln,
-- für Dom/Domina ein House anlegen und öffentliche Slot-Buchungen erlauben.

insert into public.profiles (id, display_name, role, is_adult_confirmed)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email,''),'@',1), 'Neues Mitglied'),
  case lower(coalesce(u.raw_user_meta_data ->> 'role','sub'))
    when 'dom' then 'dom'::public.user_role
    when 'domina' then 'domina'::public.user_role
    when 'sklave' then 'sklave'::public.user_role
    else 'sub'::public.user_role
  end,
  coalesce((u.raw_user_meta_data ->> 'is_adult_confirmed')::boolean, true)
from auth.users u
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  updated_at = now();

-- Synchronisiere Rollen/Namen aus profile_details, da dort das Live-Profil gepflegt wird.
update public.profiles p
set
  display_name = coalesce(nullif(d.display_name,''), p.display_name),
  role = case lower(coalesce(d.role,p.role::text))
    when 'dom' then 'dom'::public.user_role
    when 'domina' then 'domina'::public.user_role
    when 'sklave' then 'sklave'::public.user_role
    else 'sub'::public.user_role
  end,
  updated_at = now()
from public.profile_details d
where d.user_id = p.id;

-- Jeder Dom/Domina erhält ein eigenes House, falls noch keines existiert.
insert into public.houses (owner_id, name, welcome_message, relationship_style, applications_open, is_public)
select p.id, p.display_name || ' · House', '', 'private_circle', true, true
from public.profiles p
where p.role in ('dom','domina')
  and not exists (select 1 from public.houses h where h.owner_id = p.id);

-- Künftige Nutzer weiterhin zuverlässig in public.profiles spiegeln.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role, is_adult_confirmed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,''),'@',1), 'Neues Mitglied'),
    case lower(coalesce(new.raw_user_meta_data ->> 'role','sub'))
      when 'dom' then 'dom'::public.user_role
      when 'domina' then 'domina'::public.user_role
      when 'sklave' then 'sklave'::public.user_role
      else 'sub'::public.user_role
    end,
    coalesce((new.raw_user_meta_data ->> 'is_adult_confirmed')::boolean, true)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

-- Öffentliche Studio-Tage dürfen auch von noch nicht aufgenommenen Subs angefragt werden.
drop policy if exists "members request available slots" on public.slot_bookings;
create policy "members or public visitors request available slots"
on public.slot_bookings for insert to authenticated
with check (
  requester_id = auth.uid()
  and exists (
    select 1
    from public.studio_slots ss
    join public.studio_days sd on sd.id = ss.studio_day_id
    where ss.id = slot_bookings.slot_id
      and ss.is_available = true
      and (
        sd.is_public = true
        or exists (
          select 1 from public.memberships m
          where m.house_id = slot_bookings.house_id
            and m.member_id = auth.uid()
            and m.ended_at is null
        )
      )
  )
);
