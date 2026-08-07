-- Robuster Schreibweg fuer Studio-Zeitfenster.
-- Vermeidet direkte Client-Inserts und stellt Profil/House serverseitig sicher.

create or replace function public.publish_studio_window(
  p_event_date date,
  p_starts_at time,
  p_ends_at time,
  p_studio_name text,
  p_price_cents integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_name text;
  v_house_id uuid;
  v_day_id uuid;
begin
  if v_uid is null then raise exception 'Bitte zuerst anmelden.'; end if;
  if p_event_date is null then raise exception 'Bitte ein Datum angeben.'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then raise exception 'Die Endzeit muss nach der Startzeit liegen.'; end if;
  if nullif(trim(coalesce(p_studio_name, '')), '') is null then raise exception 'Bitte Studio oder Ort angeben.'; end if;
  if p_price_cents is not null and p_price_cents < 0 then raise exception 'Der Preis darf nicht negativ sein.'; end if;

  select
    lower(coalesce(u.raw_user_meta_data ->> 'role', p.role::text, '')),
    coalesce(nullif(p.display_name, ''), nullif(u.raw_user_meta_data ->> 'display_name', ''), nullif(u.raw_user_meta_data ->> 'name', ''), split_part(coalesce(u.email, ''), '@', 1), 'House')
  into v_role, v_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  if v_role not in ('dom', 'domina') then raise exception 'Nur Dom/Domina kann Studio-Zeitfenster veröffentlichen.'; end if;

  insert into public.profiles (id, display_name, role, is_adult_confirmed)
  values (v_uid, v_name, case when v_role = 'domina' then 'domina'::public.user_role else 'dom'::public.user_role end, true)
  on conflict (id) do update set role = excluded.role, updated_at = now();

  select h.id into v_house_id from public.houses h where h.owner_id = v_uid limit 1;
  if v_house_id is null then
    insert into public.houses (owner_id, name, welcome_message, relationship_style, applications_open, is_public)
    values (v_uid, v_name || ' · House', '', 'private_circle', true, true)
    returning id into v_house_id;
  end if;

  insert into public.studio_days (
    house_id, creator_id, event_date, starts_at, ends_at, studio_name,
    slot_length_minutes, break_minutes, price_cents, currency, is_public, booking_enabled
  ) values (
    v_house_id, v_uid, p_event_date, p_starts_at, p_ends_at, trim(p_studio_name),
    60, 0, p_price_cents, 'EUR', true, true
  ) returning id into v_day_id;

  return v_day_id;
end;
$$;

revoke all on function public.publish_studio_window(date, time, time, text, integer) from public;
grant execute on function public.publish_studio_window(date, time, time, text, integer) to authenticated;
