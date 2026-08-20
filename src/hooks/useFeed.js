import { queryKeys, unwrap } from "@/lib/queryClient";
import { fetchPosts } from "@/services/postService";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * The post feed: cursor pagination plus the debounced username filter.
 *
 * The debounced value is part of the query key, so react-query keeps a cache
 * entry per search and ignores responses for keys that are no longer active —
 * a slow reply for an abandoned search can't overwrite the list.
 */
export const useFeed = () => {
  const [usernameFilter, setUsernameFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  useEffect(() => {
    const timeout = setTimeout(
      () => setAppliedFilter(usernameFilter.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [usernameFilter]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.posts(appliedFilter),
    queryFn: async ({ pageParam }) => {
      const result = unwrap(
        await fetchPosts({
          limit: PAGE_SIZE,
          cursor: pageParam,
          userName: appliedFilter || null,
        }),
      );
      return { data: result.data ?? [], nextCursor: result.nextCursor ?? null };
    },
    initialPageParam: null,
    // Keyset cursor: `null` means the server has nothing more to give.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const loadMore = () => {
    // In-flight guard: onEndReached fires repeatedly while scrolling.
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  };

  return {
    ...query,
    posts: query.data?.pages.flatMap((page) => page.data) ?? [],
    usernameFilter,
    setUsernameFilter,
    loadMore,
  };
};
