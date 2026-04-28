-- Supabase linter: anon/authenticated must not EXECUTE SECURITY DEFINER helpers exposed via PostgREST RPC.
-- `public.rls_auto_enable()` returns event_trigger and is intended for DDL event triggers only.

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;
