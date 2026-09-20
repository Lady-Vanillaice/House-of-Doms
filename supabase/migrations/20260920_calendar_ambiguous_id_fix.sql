-- Repair calendar RPCs where output column "id" conflicts with unqualified SQL columns.
create or replace function public.update_my_studio_window_visibility(p_id uuid,p_hidden boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(
    select 1
    from public.studio_days s
    join public.houses h on h.id=s.house_id
    where s.id=p_id and h.owner_id=auth.uid()
  ) then raise exception 'Forbidden'; end if;
  update public.studio_days s
  set is_hidden=p_hidden,is_public=not p_hidden,updated_at=now()
  where s.id=p_id;
end $$;

create or replace function public.delete_my_studio_window(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(
    select 1
    from public.studio_days s
    join public.houses h on h.id=s.house_id
    where s.id=p_id and h.owner_id=auth.uid()
  ) then raise exception 'Forbidden'; end if;
  if exists(select 1 from public.slot_bookings b where b.studio_day_id=p_id and b.status in ('requested','confirmed')) then
    raise exception 'Zeitfenster hat aktive Buchungen.';
  end if;
  delete from public.studio_days s where s.id=p_id;
end $$;

grant execute on function public.update_my_studio_window_visibility(uuid,boolean) to authenticated;
grant execute on function public.delete_my_studio_window(uuid) to authenticated;

select pg_notify('pgrst','reload schema');
