-- Public, anonymous-friendly lookup for a single transfer by its public link id.
-- Built as a SECURITY DEFINER RPC (not the transfers_public view) so that
-- unauthenticated visitors can resolve one transfer without a direct SELECT on
-- the base transfers table. The view is security-invoker, so anonymous queries
-- on it would either fail (no anon grant on transfers) or, if granted, would
-- expose every row in the table.
create or replace function public.get_transfer_by_public_id(p_public_id text)
returns setof public.transfers_public
language sql
stable
security definer
set search_path = public
as $$
  select * from public.transfers_public where public_id = p_public_id
$$;

grant execute on function public.get_transfer_by_public_id(text) to anon, authenticated;

-- PostgREST (the Neon Data API) only exposes an RPC function to a role when
-- that role can read its return type. Without these grants the function is
-- hidden from authenticated users (404), even though the anonymous role works.
grant select on public.transfers_public to anon, authenticated;
grant select on public.transfer_timeline_events to anon, authenticated;
grant execute on function public.get_timeline_by_public_id(text) to anon, authenticated;