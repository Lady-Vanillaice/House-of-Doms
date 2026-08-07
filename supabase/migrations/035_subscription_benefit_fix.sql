-- House of Doms — fix subscription benefit lookup

create or replace function public.has_subscription_benefit(p_benefit_key text)
returns boolean
language sql
security definer
set search_path=public
stable
as $$
  select exists(
    select 1
    from public.house_subscriptions s
    join public.subscription_plans p on p.id=s.plan_id
    where s.subscriber_id=auth.uid()
      and s.status in ('trialing','active')
      and p.benefit_keys @> array[p_benefit_key]::text[]
  );
$$;

grant execute on function public.has_subscription_benefit(text) to authenticated;

notify pgrst,'reload schema';
