import Header from "@/components/Header";
import Loading from "@/components/Loading";
import NotificationItem from "@/components/NotificationItem";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { queryKeys, unwrap } from "@/lib/queryClient";
import {
  fetchNotifications,
  markNotificationsSeen,
} from "@/services/notificationServices";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const PAGE_SIZE = 20;

const Notifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

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
    queryKey: queryKeys.notifications,
    queryFn: async ({ pageParam }) => {
      const result = unwrap(
        await fetchNotifications({ limit: PAGE_SIZE, cursor: pageParam }),
      );
      return { data: result.data ?? [], nextCursor: result.nextCursor ?? null };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user?.id,
  });

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  const { mutate: markSeen } = useMutation({
    mutationFn: markNotificationsSeen,
    // The list has been shown, so the badge must clear even if the user
    // leaves immediately.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.unseenCount }),
  });

  useEffect(() => {
    if (!isLoading && !isError && notifications.length > 0) {
      markSeen();
    }
    // Only re-run when the first load finishes; markSeen is idempotent.
  }, [isLoading, isError]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderFooter = () => {
    if (isLoading || isFetchingNextPage) {
      return <Loading />;
    }

    if (isError) {
      return (
        <Text style={styles.noNotificationsText}>
          {error?.message || "Could not load notifications"}
        </Text>
      );
    }

    if (notifications.length === 0) {
      return (
        <Text style={styles.noNotificationsText}>No notifications found.</Text>
      );
    }

    return null;
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Notifications" />

        {/* Virtualised: the list used to render every notification inside a
            ScrollView, which mounts all of them at once. */}
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => (
            <NotificationItem item={item} router={router} />
          )}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  scrollContainer: {
    paddingVertical: 20,
    gap: 5,
  },
  noNotificationsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
