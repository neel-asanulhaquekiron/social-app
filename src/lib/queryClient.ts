import type { ApiResult, ApiSuccess } from "@/types/api";
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
  posts: (filter = "") => ["posts", filter] as const,
  allPosts: ["posts"] as const,
  post: (postId: string | number) => ["post", String(postId)] as const,
  comments: (postId: string | number) => ["comments", String(postId)] as const,
  notifications: ["notifications"] as const,
  unseenCount: ["unseenCount"] as const,
};

/**
 * react-query treats a thrown error as failure; our API returns a result.
 * Narrowing here is what lets callers read `.data` without checking first.
 */
export const unwrap = <T>(result: ApiResult<T>): ApiSuccess<T> => {
  if (!result?.success) {
    throw new Error(result?.msg || "Something went wrong");
  }
  return result;
};
