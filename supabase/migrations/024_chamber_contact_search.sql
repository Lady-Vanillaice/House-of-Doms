-- House of Doms — chamber contact search
create or replace function public.search_chamber_contacts(p_query text default '')
returns table(user_id uuid, display_name text, role text)
language sql
security definer
set search_path=public
stable
as $$
  select p.id, p.display_name, p.role::text
  from public.profiles p
  where p.id <> auth.uid()
    and (
      coalesce(trim(p_query),'') = ''
      or p.display_name ilike '%' || trim(p_query) || '%'
      or p.role::text ilike '%' || trim(p_query) || '%'
    )
  order by p.display_name
  limit 30;
$$;

grant execute on function public.search_chamber_contacts(text) to authenticated;
notify pgrst, 'reload schema';
