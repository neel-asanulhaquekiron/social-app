import Avatar from "@/components/Avatar";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { patchCommentCount, updateCachedPost } from "@/lib/postCache";
import { unsubscribeFromChannel } from "@/lib/supabase";
import { queryKeys, unwrap } from "@/lib/queryClient";
import {
  getUnseenNotificationCount,
  subscribeToNotifications,
} from "@/services/notificationServices";
import {
  fetchPosts,
  subscribeToAllComments,
  subscribeToPosts,
} from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showFilter, setShowFilter] = useState(false);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  // The debounced value is part of the query key, so react-query keeps one
  // cache entry per search and discards responses for keys that are no longer
  // active — out-of-order replies can't clobber the list any more.
  useEffect(() => {
    const timeout = setTimeout(
      () => setAppliedFilter(usernameFilter.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [usernameFilter]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
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

  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  const { data: notificationCount = 0 } = useQuery({
    queryKey: queryKeys.unseenCount,
    queryFn: async () => unwrap(await getUnseenNotificationCount()).count ?? 0,
    enabled: !!user?.id,
  });

  // Re-sync the badge whenever Home regains focus (e.g. back from
  // Notifications, where the server marked everything seen).
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.unseenCount });
      }
    }, [user?.id, queryClient]),
  );

  useEffect(() => {
    if (!user?.id) return undefined;

    const postChannel = subscribeToPosts((payload) => {
      // An edited body doesn't change which posts belong in the list (or
      // where), so patch it rather than refetching every loaded page. The
      // payload carries raw columns only; spreading over the cached row keeps
      // the joined user and the counts.
      if (payload.eventType === "UPDATE" && payload.new?.id) {
        updateCachedPost(queryClient, payload.new.id, (post) => ({
          ...post,
          ...payload.new,
        }));
        return;
      }

      // INSERT/DELETE change list membership — and whether a new post belongs
      // in the active username filter is the server's decision, so refetch
      // instead of guessing client-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.allPosts });
    });

    // Comment counts are patched in place — invalidating an infinite query
    // refetches every loaded page, which is far too much for a counter.
    const commentChannel = subscribeToAllComments((payload) => {
      const postId = payload?.new?.postId ?? payload?.old?.postId;
      const delta =
        payload.eventType === "INSERT"
          ? 1
          : payload.eventType === "DELETE"
            ? -1
            : 0;

      if (postId && delta !== 0) {
        patchCommentCount(queryClient, postId, delta);
      }
    });

    const notificationChannel = subscribeToNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unseenCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    });

    return () => {
      unsubscribeFromChannel(postChannel);
      unsubscribeFromChannel(commentChannel);
      unsubscribeFromChannel(notificationChannel);
    };
  }, [user?.id, queryClient]);

  const onEndReached = () => {
    // The in-flight guard `onEndReached` never had: it used to double-fire and
    // request the same page twice.
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.footerSpace}>
          <Loading />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.footerSpace}>
          <Text style={styles.emptyText}>
            {error?.message || "Could not load posts"}
          </Text>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (posts.length === 0) {
      return <Text style={styles.emptyText}>No posts found</Text>;
    }

    if (isFetchingNextPage) {
      return (
        <View style={styles.footerSpace}>
          <Loading />
        </View>
      );
    }

    return <Text style={styles.noMoreText}>No more posts</Text>;
  };

  return (
    <ScreenWrapper bg="white" scrollable={false}>
      <View style={styles.container}>
        {/* header */}
        <HomeHeader
          notificationCount={notificationCount}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          setUsernameFilter={setUsernameFilter}
        />

        {showFilter && (
          <View style={styles.filterContainer}>
            <Input
              placeholder="Filter by username"
              placeholderTextColor={theme.colors.textLight}
              style={styles.filterInput}
              value={usernameFilter}
              onChangeText={setUsernameFilter}
              autoCapitalize="none"
            />
            {usernameFilter.length > 0 && (
              <Pressable
                onPress={() => setUsernameFilter("")}
                style={styles.clearButton}
                hitSlop={10}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* posts */}
        <FlatList
          data={posts}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          contentContainerStyle={styles.listStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} router={router} />
          )}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const HomeHeader = ({
  notificationCount,
  showFilter,
  setShowFilter,
  setUsernameFilter,
}) => {
  const router = useRouter();

  const toggleFilter = () => {
    setShowFilter((prev) => {
      const next = !prev;
      if (!next) {
        setUsernameFilter("");
      }
      return next;
    });
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Social App</Text>
      <View style={styles.icons}>
        <Pressable onPress={toggleFilter}>
          <Ionicons
            name={showFilter ? "filter" : "filter-outline"}
            size={hp(3.2)}
            color={
              showFilter
                ? (theme.colors.primaryDark ?? theme.colors.text)
                : theme.colors.text
            }
          />
        </Pressable>

        <Pressable onPress={() => router.push("/notifications")}>
          <Ionicons
            name="notifications-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/newPost")}>
          <Ionicons
            name="add-circle-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
        </Pressable>

        <Pressable onPress={() => router.push("/profile")}>
          <Avatar size={hp(3.2)} color={theme.colors.text} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  listStyle: {
    paddingTop: 10,
    paddingBottom: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  noMoreText: {
    textAlign: "center",
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  footerSpace: {
    marginVertical: 30,
    gap: 12,
  },
  retryButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: theme.colors?.gray ?? "#e5e5e5",
  },
  retryText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontWeight: theme.fonts.semibold,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    height: hp(1.8),
    width: hp(1.8),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  notificationBadgeText: {
    color: "white",
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
  filterContainer: {
    position: "relative",
    width: "100%",
    height: hp(5.8),
    justifyContent: "center",
    marginVertical: 5,
  },
  filterInput: {
    width: "100%",
    height: "100%",
    fontSize: hp(1.8),
    color: theme.colors.text,
    paddingLeft: 0,
    paddingRight: hp(4.5),
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  clearButton: {
    position: "absolute",
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearButtonText: {
    color: theme.colors?.rose ?? "red",
    fontSize: hp(1.8),
    fontWeight: theme.fonts.bold,
  },
});
