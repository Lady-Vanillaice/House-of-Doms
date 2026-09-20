-- Calendar reads confirmed creator session requests directly.
-- Existing RLS creator policy on session_requests keeps this private to the assigned creator.
create index if not exists session_requests_creator_status_date_idx
on public.session_requests(creator_id,status,requested_date);

select pg_notify('pgrst','reload schema');
