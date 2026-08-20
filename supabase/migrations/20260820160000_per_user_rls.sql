-- Issue #16: replace the "allow all" RLS policies with per-user ones.
--
-- Context that makes this safe to tighten so far:
--   * the Express server uses the service-role key, which bypasses RLS
--     entirely — every read and write the app performs goes through it
--   * the client only ever touches these tables through Realtime, which
--     needs SELECT and nothing else
--   * since #29 the client holds a real Supabase session, so auth.uid() is
--     finally meaningful (this is what the issue was blocked on)
--
-- Before: any holder of the anon key (it ships inside the app) could read,
-- insert, update and delete every post; any signed-in user could read every
-- other user's row — including their email and push token — and read
-- everyone's notifications.
--
-- Safe to re-run.

begin;

-- ---------- posts ----------
drop policy if exists "allow all" on public.posts;
drop policy if exists posts_select_all on public.posts;
drop policy if exists posts_write_authenticated on public.posts;

-- Readable by signed-in users (Realtime needs this). Deliberately NOT anon:
-- the public feed is served by the API, which uses the service-role key.
create policy posts_select_authenticated on public.posts
  for select to authenticated using (true);

create policy posts_insert_own on public.posts
  for insert to authenticated with check ("userId" = auth.uid());

create policy posts_update_own on public.posts
  for update to authenticated
  using ("userId" = auth.uid()) with check ("userId" = auth.uid());

create policy posts_delete_own on public.posts
  for delete to authenticated using ("userId" = auth.uid());

-- ---------- comments ----------
drop policy if exists "allow all" on public.comments;
drop policy if exists comments_select_authenticated on public.comments;
drop policy if exists comments_insert_own on public.comments;
drop policy if exists comments_delete_own_or_post_owner on public.comments;

create policy comments_select_authenticated on public.comments
  for select to authenticated using (true);

create policy comments_insert_own on public.comments
  for insert to authenticated with check ("userId" = auth.uid());

-- Mirrors the server rule: the comment's author or the post's owner.
create policy comments_delete_own_or_post_owner on public.comments
  for delete to authenticated using (
    "userId" = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = "postId" and p."userId" = auth.uid()
    )
  );

-- ---------- postLikes ----------
drop policy if exists "allow all" on public."postLikes";
drop policy if exists post_likes_select_authenticated on public."postLikes";
drop policy if exists post_likes_insert_own on public."postLikes";
drop policy if exists post_likes_delete_own on public."postLikes";

create policy post_likes_select_authenticated on public."postLikes"
  for select to authenticated using (true);

create policy post_likes_insert_own on public."postLikes"
  for insert to authenticated with check ("userId" = auth.uid());

create policy post_likes_delete_own on public."postLikes"
  for delete to authenticated using ("userId" = auth.uid());

-- ---------- notifications ----------
drop policy if exists "allow all" on public.notifications;
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;

-- Only your own notifications — previously every signed-in user could read
-- (and subscribe to) everyone else's.
create policy notifications_select_own on public.notifications
  for select to authenticated using ("receiverId" = auth.uid());

create policy notifications_update_own on public.notifications
  for update to authenticated
  using ("receiverId" = auth.uid()) with check ("receiverId" = auth.uid());

-- No INSERT/DELETE policy: notifications are created by the server only.

-- ---------- users ----------
drop policy if exists "allow all access for all auth users" on public.users;
drop policy if exists users_select_self on public.users;

-- Own row only. RLS can't hide individual columns, and this table holds
-- email and pushToken; public profiles are served by the API instead.
create policy users_select_self on public.users
  for select to authenticated using (id = auth.uid());

-- No INSERT/UPDATE/DELETE policy: the signup trigger runs as the definer and
-- every profile write goes through the server.

commit;
