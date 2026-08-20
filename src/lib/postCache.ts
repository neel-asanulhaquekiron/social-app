import { queryKeys } from "@/lib/queryClient";
import type { Paginated, Post } from "@/types/api";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";

type PostPages = InfiniteData<Paginated<Post>>;

/**
 * Applies `updater` to one post everywhere it is cached — inside every
 * ["posts", filter] infinite list and in the ["post", id] single cache.
 *
 * Patching beats invalidating for high-frequency events: invalidating an
 * infinite query refetches *every page* the user has scrolled through, so a
 * busy feed would refetch the whole list on each like or comment.
 */
export const updateCachedPost = (
  queryClient: QueryClient,
  postId: string | number | null | undefined,
  updater: (post: Post) => Post,
) => {
  if (postId === undefined || postId === null) return;

  const id = typeof postId === "string" ? Number(postId) : postId;
  const apply = (post: Post) => (post?.id === id ? updater(post) : post);

  queryClient.setQueriesData<PostPages>(
    { queryKey: queryKeys.allPosts },
    (old) =>
      old?.pages
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map(apply),
            })),
          }
        : old,
  );

  queryClient.setQueryData<Post>(queryKeys.post(id), (old) =>
    old ? apply(old) : old,
  );
};

/** Optimistic like toggle; also used to roll back a failed mutation. */
export const patchLike = (
  queryClient: QueryClient,
  postId: string | number | null | undefined,
  liked: boolean,
) =>
  updateCachedPost(queryClient, postId, (post) => ({
    ...post,
    likedByMe: liked,
    likeCount: Math.max((post.likeCount ?? 0) + (liked ? 1 : -1), 0),
  }));

export const patchCommentCount = (
  queryClient: QueryClient,
  postId: string | number | null | undefined,
  delta: number,
) =>
  updateCachedPost(queryClient, postId, (post) => ({
    ...post,
    commentCount: Math.max((post.commentCount ?? 0) + delta, 0),
  }));
