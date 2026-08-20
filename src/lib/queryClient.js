import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Realtime already pushes invalidations, so background refetching can
      // be conservative; this mainly stops remounts from refetching.
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      // React Native has no window focus; screen focus is handled explicitly.
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Every cache key in one place so an invalidation can never silently miss a
 * screen. `posts` is prefixed so `["posts"]` invalidates every filter.
 */
export const queryKeys = {
  posts: (filter = "") => ["posts", filter],
  allPosts: ["posts"],
  post: (postId) => ["post", String(postId)],
  comments: (postId) => ["comments", String(postId)],
  notifications: ["notifications"],
  unseenCount: ["unseenCount"],
};

/** react-query treats a thrown error as failure; our API returns a result. */
export const unwrap = (result) => {
  if (!result?.success) {
    throw new Error(result?.msg || "Something went wrong");
  }
  return result;
};
