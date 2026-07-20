import Avatar from "@/components/Avatar";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { subscribeToNotifications } from "@/services/notificationServices";
import {
  fetchPosts,
  subscribeToAllComments,
  subscribeToPosts,
  unsubscribeFromChannel,
} from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [usernameFilter, setUsernameFilter] = useState("");
  const limitRef = useRef(0);

  const getPosts = async ({ isNewSearch = false } = {}) => {
    if (!hasMorePosts && !isNewSearch) {
      return;
    }

    limitRef.current = isNewSearch ? 6 : limitRef.current + 6;

    const { success, data, msg } = await fetchPosts(
      limitRef.current,
      usernameFilter.trim() || undefined,
    );

    if (success) {
      if (!isNewSearch && posts.length > 0 && data.length === posts.length) {
        setHasMorePosts(false);
      }
      if (isNewSearch) {
        setHasMorePosts(true);
      }
      setPosts(data);
    } else {
      console.error("Error fetching posts:", msg);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getPosts({ isNewSearch: true });
    setRefreshing(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getPosts({ isNewSearch: true });
    }, 400); // debounce: wait for user to stop typing

    return () => clearTimeout(timeout);
  }, [usernameFilter]);

  useEffect(() => {
    const postChannel = subscribeToPosts(setPosts);
    const commentChannel = subscribeToAllComments(setPosts);
    const notificationChannel = subscribeToNotifications(
      user?.id,
      setNotificationCount,
    );

    return () => {
      unsubscribeFromChannel(postChannel);
      unsubscribeFromChannel(commentChannel);
      unsubscribeFromChannel(notificationChannel);
    };
  }, []);

  return (
    <ScreenWrapper bg="white" scrollable={false}>
      <View style={styles.container}>
        {/* header */}
        <HomeHeader
          notificationCount={notificationCount}
          setNotificationCount={setNotificationCount}
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => getPosts()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMorePosts ? (
              <View style={{ marginVertical: posts.length === 0 ? 200 : 30 }}>
                <Loading />
              </View>
            ) : (
              <Text style={styles.noMoreText}>No more posts</Text>
            )
          }
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
  setNotificationCount,
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

        <Pressable
          onPress={() => {
            setNotificationCount(0);
            router.push("notifications");
          }}
        >
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

        <Pressable onPress={() => router.push("newPost")}>
          <Ionicons
            name="add-circle-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
        </Pressable>

        <Pressable onPress={() => router.push("profile")}>
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
  post: {
    padding: 14,
    borderRadius: theme.radius?.md ?? 12,
    borderWidth: 1,
    borderColor: theme.colors?.gray ?? "#e0e0e0",
    marginBottom: 14,
  },
  postTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  postContent: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
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
