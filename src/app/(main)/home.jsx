import HomeHeader from "@/components/HomeHeader";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import { useFeed } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { useUnseenCount } from "@/hooks/useUnseenCount";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Home = () => {
  const [showFilter, setShowFilter] = useState(false);

  const {
    posts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isFetchingNextPage,
    loadMore,
    usernameFilter,
    setUsernameFilter,
  } = useFeed();

  const notificationCount = useUnseenCount();
  useRealtimeFeed();

  const toggleFilter = () => {
    setShowFilter((prev) => {
      const next = !prev;
      if (!next) {
        setUsernameFilter("");
      }
      return next;
    });
  };

  const renderItem = useCallback(({ item }) => <PostCard item={item} />, []);

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
          <Pressable
            onPress={() => refetch()}
            style={styles.retryButton}
            accessibilityRole="button"
          >
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
        <HomeHeader
          notificationCount={notificationCount}
          showFilter={showFilter}
          onToggleFilter={toggleFilter}
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
              accessibilityLabel="Filter by username"
            />
            {usernameFilter.length > 0 && (
              <Pressable
                onPress={() => setUsernameFilter("")}
                style={styles.clearButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Clear username filter"
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            )}
          </View>
        )}

        <FlatList
          data={posts}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          contentContainerStyle={styles.listStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          renderItem={renderItem}
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
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
