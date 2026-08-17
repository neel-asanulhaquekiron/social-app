-- Issue #16 (emergency part).
--
-- The "allow all" policy on public.posts was granted to role `public`, which
-- includes `anon`. Anyone holding the anon/publishable key (it is bundled in
-- the mobile app) could INSERT / UPDATE / DELETE any post directly through the
-- Supabase REST API, bypassing the Express server entirely.
--
-- This replaces it with:
--   * read-only access for anon + authenticated (keeps the realtime feed working)
--   * writes only for authenticated (same posture as the other tables until the
--     per-user `auth.uid()` policies land with the auth-model change, #29)
--
-- The Express server uses the service-role key and is unaffected.

drop policy if exists "allow all" on public.posts;

create policy "posts_select_all"
  on public.posts
  for select
  to anon, authenticated
  using (true);

create policy "posts_write_authenticated"
  on public.posts
  for all
  to authenticated
  using (true)
  with check (true);
