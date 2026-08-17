-- Issue #27: constraints, indexes and sane defaults.
--
--  * UNIQUE (postId, userId) on postLikes — the like toggle relied on it
--  * covering indexes for every FK + the hot query paths
--  * isSeen / isClicked NOT NULL DEFAULT false (code no longer needs `not is true`)
--  * notifications.data text -> jsonb
--  * FK columns NOT NULL, ON DELETE CASCADE so deleting a user/post cleans up
--
-- Safe to re-run: every statement is idempotent.

begin;

-- ---------- postLikes ----------
alter table public."postLikes"
  drop constraint if exists postlikes_post_user_unique;
alter table public."postLikes"
  add constraint postlikes_post_user_unique unique ("postId", "userId");

-- ---------- notification flags / data ----------
update public.notifications set "isSeen" = false where "isSeen" is null;
update public.notifications set "isClicked" = false where "isClicked" is null;

alter table public.notifications
  alter column "isSeen" set default false,
  alter column "isSeen" set not null,
  alter column "isClicked" set default false,
  alter column "isClicked" set not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications'
      and column_name = 'data' and data_type = 'text'
  ) then
    alter table public.notifications
      alter column data type jsonb using nullif(data, '')::jsonb;
  end if;
end $$;

-- ---------- FK columns NOT NULL + ON DELETE CASCADE ----------
alter table public.posts        alter column "userId"     set not null;
alter table public."postLikes"  alter column "postId"     set not null,
                                alter column "userId"     set not null;
alter table public.comments     alter column "postId"     set not null,
                                alter column "userId"     set not null;
alter table public.notifications alter column "senderId"   set not null,
                                 alter column "receiverId" set not null;

alter table public.posts
  drop constraint if exists "posts_userId_fkey",
  add constraint "posts_userId_fkey" foreign key ("userId")
    references public.users(id) on delete cascade;

alter table public."postLikes"
  drop constraint if exists "postLikes_postId_fkey",
  add constraint "postLikes_postId_fkey" foreign key ("postId")
    references public.posts(id) on delete cascade,
  drop constraint if exists "postLikes_userId_fkey",
  add constraint "postLikes_userId_fkey" foreign key ("userId")
    references public.users(id) on delete cascade;

alter table public.comments
  drop constraint if exists "comments_postId_fkey",
  add constraint "comments_postId_fkey" foreign key ("postId")
    references public.posts(id) on delete cascade,
  drop constraint if exists "comments_userId_fkey",
  add constraint "comments_userId_fkey" foreign key ("userId")
    references public.users(id) on delete cascade;

alter table public.notifications
  drop constraint if exists "notifications_senderId_fkey",
  add constraint "notifications_senderId_fkey" foreign key ("senderId")
    references public.users(id) on delete cascade,
  drop constraint if exists "notifications_receiverId_fkey",
  add constraint "notifications_receiverId_fkey" foreign key ("receiverId")
    references public.users(id) on delete cascade;

-- ---------- indexes ----------
create index if not exists posts_user_id_idx
  on public.posts ("userId");
create index if not exists posts_created_at_id_idx
  on public.posts (created_at desc, id desc);

create index if not exists post_likes_post_id_idx
  on public."postLikes" ("postId");
create index if not exists post_likes_user_id_idx
  on public."postLikes" ("userId");

create index if not exists comments_post_id_created_at_idx
  on public.comments ("postId", created_at);
create index if not exists comments_user_id_idx
  on public.comments ("userId");

create index if not exists notifications_sender_id_idx
  on public.notifications ("senderId");
create index if not exists notifications_receiver_created_idx
  on public.notifications ("receiverId", created_at desc);
create index if not exists notifications_receiver_unseen_idx
  on public.notifications ("receiverId") where "isSeen" = false;
create index if not exists notifications_data_post_id_idx
  on public.notifications (((data ->> 'postId')));

create index if not exists users_push_token_idx
  on public.users ("pushToken") where "pushToken" is not null;

-- username search uses ilike '%x%'
create extension if not exists pg_trgm;
create index if not exists users_name_trgm_idx
  on public.users using gin (name gin_trgm_ops);

commit;
