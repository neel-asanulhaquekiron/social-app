import { hp } from "@/helpers/common";
import { formatShortDate } from "@/helpers/date";
import { useLike } from "@/hooks/useLike";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Avatar from "./Avatar";

const MAX_LINES = 6;

/**
 * Presentational post row. Navigation and the like mutation come from hooks
 * used in place, so nothing has to be drilled down from the list screens.
 */
const PostCard = ({
  item,
  hasShadow = true,
  disableDetailsNavigation = false,
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const router = useRouter();
  const { toggleLike, isPending: likePending } = useLike(item?.id);
  const [expanded, setExpanded] = useState(false);
  // null = not measured yet. Once measured the hidden clone below is dropped,
  // so each card pays for the extra text layout exactly once instead of on
  // every re-render.
  const [needsSeeMore, setNeedsSeeMore] = useState(null);

  const liked = !!item?.likedByMe;
  const likeCount = item?.likeCount ?? 0;
  const commentCount = item?.commentCount ?? 0;
  const createdAt = formatShortDate(item?.created_at);

  const openPostDetails = () => {
    if (!disableDetailsNavigation) {
      router.push({ pathname: "/postDetails", params: { postId: item?.id } });
    }
  };

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const onTextLayout = (e) => {
    setNeedsSeeMore(e.nativeEvent.lines.length > MAX_LINES);
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

            {/* Unclamped clone used only to count the real number of lines.
                Rendered until the answer is known, then never again. */}
            {needsSeeMore === null && (
              <Text
                style={[styles.content, styles.hiddenMeasure]}
                onTextLayout={onTextLayout}
              >
                {item.body}
              </Text>
            )}

            {needsSeeMore && (
              <TouchableOpacity
                onPress={toggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={expanded ? "See less" : "See more"}
                hitSlop={8}
              >
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
          {/* Disabled while in flight: a rapid double-tap used to fire two
              requests, and the second could land before the first. */}
          <TouchableOpacity
            onPress={() => toggleLike(!liked)}
            disabled={likePending}
            accessibilityRole="button"
            accessibilityLabel={liked ? "Unlike post" : "Like post"}
            accessibilityState={{ selected: liked, disabled: likePending }}
            hitSlop={8}
          >
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
            accessibilityRole="button"
            accessibilityLabel={`${commentCount} comments`}
            hitSlop={8}
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

// Rows only re-render when their own post object changes identity.
export default memo(PostCard);

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray,
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
    color: theme.colors.primaryDark,
    fontWeight: theme.fonts.semiBold,
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
}));
