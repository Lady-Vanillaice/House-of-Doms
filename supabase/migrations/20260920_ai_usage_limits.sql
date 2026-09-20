create table if not exists public.ai_usage_settings (
  id smallint primary key default 1 check (id = 1),
  monthly_creator_requests integer not null default 100 check (monthly_creator_requests > 0),
  global_monthly_budget_usd numeric(12,2) not null default 100 check (global_monthly_budget_usd > 0),
  per_minute_requests integer not null default 10 check (per_minute_requests > 0),
  updated_at timestamptz not null default now()
);

insert into public.ai_usage_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('messages','tasks')),
  status text not null default 'reserved' check (status in ('reserved','completed','failed')),
  model text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

create index if not exists ai_usage_events_created_idx
  on public.ai_usage_events (created_at desc);

alter table public.ai_usage_settings enable row level security;
alter table public.ai_usage_events enable row level security;

create or replace function public.reserve_ai_request(p_feature text)
returns table (
  reservation_id uuid,
  allowed boolean,
  reason text,
  monthly_used integer,
  monthly_limit integer,
  global_spend numeric,
  global_budget numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_month_start timestamptz := date_trunc('month', now());
  v_rate_count integer := 0;
  v_month_count integer := 0;
  v_spend numeric := 0;
  v_settings public.ai_usage_settings%rowtype;
  v_id uuid;
  v_role text := '';
  v_reserved_cost numeric := 0.005;
begin
  if v_user is null then
    return query select null::uuid, false, 'not_authenticated', 0, 0, 0::numeric, 0::numeric;
    return;
  end if;

  select lower(coalesce(p.role::text,'')) into v_role from public.profiles p where p.id = v_user;
  if v_role not in ('dom','domina','creator') then
    return query select null::uuid, false, 'creator_only', 0, 0, 0::numeric, 0::numeric;
    return;
  end if;

  if p_feature not in ('messages','tasks') then
    return query select null::uuid, false, 'invalid_feature', 0, 0, 0::numeric, 0::numeric;
    return;
  end if;

  select * into v_settings from public.ai_usage_settings where id = 1;
  perform pg_advisory_xact_lock(hashtext(v_user::text || ':' || v_month_start::text));

  select count(*)::integer into v_rate_count
  from public.ai_usage_events
  where user_id = v_user
    and created_at >= now() - interval '1 minute';

  select count(*)::integer into v_month_count
  from public.ai_usage_events
  where user_id = v_user
    and created_at >= v_month_start
;

  select coalesce(sum(estimated_cost_usd),0) into v_spend
  from public.ai_usage_events
  where created_at >= v_month_start;

  if v_rate_count >= v_settings.per_minute_requests then
    return query select null::uuid, false, 'rate_limit', v_month_count, v_settings.monthly_creator_requests, v_spend, v_settings.global_monthly_budget_usd;
    return;
  end if;

  if v_month_count >= v_settings.monthly_creator_requests then
    return query select null::uuid, false, 'monthly_limit', v_month_count, v_settings.monthly_creator_requests, v_spend, v_settings.global_monthly_budget_usd;
    return;
  end if;

  if v_spend + v_reserved_cost > v_settings.global_monthly_budget_usd then
    return query select null::uuid, false, 'global_budget', v_month_count, v_settings.monthly_creator_requests, v_spend, v_settings.global_monthly_budget_usd;
    return;
  end if;

  insert into public.ai_usage_events (user_id, feature, estimated_cost_usd)
  values (v_user, p_feature, v_reserved_cost)
  returning id into v_id;

  return query select v_id, true, null::text, v_month_count + 1, v_settings.monthly_creator_requests, v_spend + v_reserved_cost, v_settings.global_monthly_budget_usd;
end;
$$;

create or replace function public.finish_ai_request(
  p_reservation_id uuid,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events
  set
    status = case when p_success then 'completed' else 'failed' end,
    model = left(coalesce(p_model,''),120),
    input_tokens = greatest(coalesce(p_input_tokens,0),0),
    output_tokens = greatest(coalesce(p_output_tokens,0),0),
    estimated_cost_usd = greatest(estimated_cost_usd, greatest(coalesce(p_estimated_cost_usd,0),0)),
    completed_at = now()
  where id = p_reservation_id
    and user_id = auth.uid();
end;
$$;

create or replace function public.get_ai_usage_status()
returns table (
  monthly_used integer,
  monthly_limit integer,
  monthly_remaining integer,
  global_spend numeric,
  global_budget numeric,
  per_minute_limit integer,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_month_start timestamptz := date_trunc('month', now());
  v_settings public.ai_usage_settings%rowtype;
  v_used integer := 0;
  v_spend numeric := 0;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_settings from public.ai_usage_settings where id = 1;

  select count(*)::integer into v_used
  from public.ai_usage_events
  where user_id = v_user
    and created_at >= v_month_start
;

  select coalesce(sum(estimated_cost_usd),0) into v_spend
  from public.ai_usage_events
  where created_at >= v_month_start;

  return query
  select
    v_used,
    v_settings.monthly_creator_requests,
    greatest(v_settings.monthly_creator_requests - v_used, 0),
    v_spend,
    v_settings.global_monthly_budget_usd,
    v_settings.per_minute_requests,
    v_month_start + interval '1 month';
end;
$$;

revoke all on public.ai_usage_settings from anon, authenticated;
revoke all on public.ai_usage_events from anon, authenticated;
revoke all on function public.reserve_ai_request(text) from public;
revoke all on function public.finish_ai_request(uuid,text,integer,integer,numeric,boolean) from public;
revoke all on function public.get_ai_usage_status() from public;
grant execute on function public.reserve_ai_request(text) to authenticated;
grant execute on function public.finish_ai_request(uuid,text,integer,integer,numeric,boolean) to authenticated;
grant execute on function public.get_ai_usage_status() to authenticated;

select pg_notify('pgrst','reload schema');
