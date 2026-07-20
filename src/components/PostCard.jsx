import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { createNotification } from "@/services/notificationServices";
import { createPostLike, removePostLike } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Avatar from "./Avatar";

const MAX_LINES = 6;

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  onDelete,
  onEdit,
  disableDetailsNavigation = false,
}) => {
  const [likes, setLikes] = useState(item?.postLikes || []);
  const liked = likes.some((like) => like.userId === currentUser?.id);
  const [expanded, setExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);

  const createdAt = moment(item?.created_at).format("MMM D");

  const onLikePress = async () => {
    try {
      if (liked) {
        const updatedLikes = likes.filter(
          (like) => like.userId !== currentUser?.id,
        );
        setLikes(updatedLikes);
        const { success, error } = await removePostLike(item?.id);
        if (!success) {
          console.error("Error un-liking post:", error);
        }
      } else {
        const data = {
          postId: item?.id,
          userId: currentUser?.id,
        };
        setLikes([...likes, data]);
        const { success, error } = await createPostLike(item?.id);
        if (success) {
          if (currentUser?.id !== item?.userId) {
            const notify = {
              senderId: currentUser?.id,
              receiverId: item?.userId,
              title: "liked your post",
              data: JSON.stringify({ postId: item?.id }),
            };
            await createNotification(notify);
          }
        } else {
          console.error("Error liking post:", error);
        }
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    }
  };

  const openPostDetails = () => {
    if (!disableDetailsNavigation) {
      router.push({ pathname: "postDetails", params: { postId: item?.id } });
    }
  };

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const onTextLayout = (e) => {
    if (!expanded) {
      setShowSeeMore(e.nativeEvent.lines.length > MAX_LINES);
    }
  };

  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      <View style={styles.header}>
        {/* user info and post time */}
        <View style={styles.userInfo}>
          <Avatar size={hp(5)} color={theme.colors.text} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
      </View>

      {/* post body */}
      <View style={styles.body}>
        {item?.body && (
          <>
            <Text
              style={styles.content}
              numberOfLines={expanded ? undefined : MAX_LINES}
            >
              {item.body}
            </Text>

            {/* Hidden, unclamped clone — used only to measure true line count */}
            {!expanded && (
              <Text
                style={[styles.content, styles.hiddenMeasure]}
                onTextLayout={onTextLayout}
              >
                {item.body}
              </Text>
            )}

            {showSeeMore && (
              <TouchableOpacity onPress={toggleExpanded}>
                <Text style={styles.seeMoreText}>
                  {expanded ? "See less" : "See more"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* footer actions */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLikePress}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={hp(2.6)}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likes.length ?? 0}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity
            disabled={disableDetailsNavigation}
            onPress={openPostDetails}
          >
            <Ionicons
              name="chatbubble-outline"
              size={hp(2.4)}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.comments?.[0]?.count ?? 0}</Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: theme.radius?.lg ?? 16,
    borderWidth: 1,
    borderColor: theme.colors?.gray ?? "#e5e5e5",
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  menu: {
    position: "absolute",
    top: hp(3.2),
    right: 0,
    backgroundColor: "white",
    borderRadius: theme.radius?.md ?? 12,
    borderWidth: 1,
    borderColor: theme.colors?.gray ?? "#e5e5e5",
    paddingVertical: 6,
    minWidth: 130,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuText: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  body: {
    gap: 10,
  },
  content: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    lineHeight: hp(2.4),
  },
  postImage: {
    width: "100%",
    height: hp(30),
    borderRadius: theme.radius?.md ?? 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 4,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  hiddenMeasure: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
});
