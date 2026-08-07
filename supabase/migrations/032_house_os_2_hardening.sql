-- House OS 2 — hardening

-- Applicants may submit/read their applications, but status changes are RPC-only.
revoke update, delete on public.house_applications from authenticated;
grant select, insert on public.house_applications to authenticated;

-- Only House owners can inspect delegated permissions directly.
revoke all on public.house_delegate_permissions from authenticated;
grant select, insert, update, delete on public.house_delegate_permissions to authenticated;

-- Keep private dossier notes owner-only through RLS and block direct reads for non-owners.
revoke all on public.house_member_notes from authenticated;
grant select, insert, update, delete on public.house_member_notes to authenticated;

notify pgrst,'reload schema';