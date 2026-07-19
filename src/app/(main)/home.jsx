import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import PostCard from "@/components/PostCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { subscribeToNotifications } from "../../../services/notificationServices";
import {
  fetchPosts,
  subscribeToAllComments,
  subscribeToPosts,
  unsubscribeFromChannel,
} from "../../../services/postService";

var limit = 0;

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const getPosts = async () => {
    if (!hasMorePosts) {
      return;
    }

    limit = limit + 6;
    console.log("Fetching posts with limit:", limit);
    const { success, data, msg } = await fetchPosts(limit);

    if (success) {
      if (posts.length > 0 && data.length === posts.length) {
        setHasMorePosts(false);
      }
      setPosts(data);
    } else {
      console.error("Error fetching posts:", msg);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    limit = 0; // Reset limit to initial value on refresh
    await getPosts();
    setRefreshing(false);
  };

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
        />

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

const HomeHeader = ({ notificationCount, setNotificationCount }) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Social App</Text>
      <View style={styles.icons}>
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
});
