-- Issue #28: Supabase security advisor — "Function public.handle_new_user()
-- can be executed by the anon role".
--
-- The function only exists to back the on-signup trigger on auth.users, so no
-- API role ever needs to call it directly. Postgres does not check EXECUTE
-- when a trigger fires, so revoking these grants cannot break signup.
--
-- Note: the advisor also recommends enabling leaked-password protection,
-- but that toggle is Pro-plan only and is skipped on this project.
--
-- Safe to re-run: REVOKE is idempotent.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
