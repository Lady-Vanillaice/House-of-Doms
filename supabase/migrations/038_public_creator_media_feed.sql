-- Public live creator content feed for House of Doms
create or replace function public.get_public_creator_media_feed()
returns table(
  id uuid,
  site_slug text,
  creator_name text,
  title text,
  description text,
  media_url text,
  media_type text,
  access_mode text,
  price_cents integer,
  categories text[],
  can_access boolean,
  purchase_status text
)
language sql security definer set search_path=public stable as $$
  select
    m.id,
    ds.slug,
    ds.display_name,
    m.title,
    m.description,
    case
      when m.owner_id=auth.uid() or m.access_mode='public'
        or (m.access_mode='members' and exists(
          select 1 from public.houses h
          join public.house_subscriptions hs on hs.house_id=h.id
          where h.owner_id=m.owner_id and hs.subscriber_id=auth.uid()
            and hs.status in ('trialing','active')
            and (hs.current_period_end is null or hs.current_period_end>now())
        ))
        or (m.access_mode='ppv' and exists(
          select 1 from public.creator_media_purchases mp
          where mp.media_id=m.id and mp.buyer_id=auth.uid() and mp.status='paid'
        ))
      then m.media_url else null end,
    m.media_type,
    m.access_mode,
    m.price_cents,
    m.categories,
    (
      m.owner_id=auth.uid() or m.access_mode='public'
      or (m.access_mode='members' and exists(
        select 1 from public.houses h
        join public.house_subscriptions hs on hs.house_id=h.id
        where h.owner_id=m.owner_id and hs.subscriber_id=auth.uid()
          and hs.status in ('trialing','active')
          and (hs.current_period_end is null or hs.current_period_end>now())
      ))
      or (m.access_mode='ppv' and exists(
        select 1 from public.creator_media_purchases mp
        where mp.media_id=m.id and mp.buyer_id=auth.uid() and mp.status='paid'
      ))
    ),
    (select mp.status from public.creator_media_purchases mp where mp.media_id=m.id and mp.buyer_id=auth.uid() limit 1)
  from public.creator_media m
  join public.domina_sites ds on ds.id=m.site_id
  where m.is_published=true and ds.is_published=true
  order by m.created_at desc;
$$;
grant execute on function public.get_public_creator_media_feed() to anon,authenticated;
notify pgrst,'reload schema';
