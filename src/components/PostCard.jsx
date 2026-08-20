import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { patchLike } from "@/lib/postCache";
import { queryKeys } from "@/lib/queryClient";
import { createPostLike, removePostLike } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  disableDetailsNavigation = false,
}) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);

  const liked = !!item?.likedByMe;
  const likeCount = item?.likeCount ?? 0;
  const commentCount = item?.commentCount ?? 0;
  const createdAt = moment(item?.created_at).format("MMM D");

  const { mutate: toggleLike } = useMutation({
    mutationFn: (nextLiked) =>
      nextLiked ? createPostLike(item?.id) : removePostLike(item?.id),
    onMutate: async (nextLiked) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.post(item?.id) });
      patchLike(queryClient, item?.id, nextLiked);
      return { previousLiked: liked };
    },
    onError: (error, _nextLiked, context) => {
      // Roll the optimistic update back.
      patchLike(queryClient, item?.id, context?.previousLiked ?? liked);
      console.error("Error liking/unliking post:", error.message);
    },
    onSuccess: () => {
      // The server also creates the owner's notification + push after a like.
      queryClient.invalidateQueries({ queryKey: queryKeys.post(item?.id) });
    },
  });

  const openPostDetails = () => {
    if (!disableDetailsNavigation) {
      router.push({ pathname: "/postDetails", params: { postId: item?.id } });
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
          <TouchableOpacity onPress={() => toggleLike(!liked)}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={hp(2.6)}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likeCount}</Text>
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
          <Text style={styles.count}>{commentCount}</Text>
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
  body: {
    gap: 10,
  },
  content: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    lineHeight: hp(2.4),
  },
  seeMoreText: {
    fontSize: hp(1.6),
    color: theme.colors.primaryDark ?? theme.colors.text,
    fontWeight: theme.fonts.semibold,
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
