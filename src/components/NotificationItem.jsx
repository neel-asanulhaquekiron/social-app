import Avatar from "@/components/Avatar";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { formatShortDate } from "@/helpers/date";
import { queryKeys } from "@/lib/queryClient";
import { markNotificationAsClicked } from "@/services/notificationServices";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// `data` is jsonb from the API (object); tolerate legacy JSON strings too.
const parseNotificationData = (data) => {
  if (!data) return {};
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const NotificationItem = ({ item }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, title, data, sender, created_at, isClicked } = item || {};
  const createdAt = formatShortDate(created_at);

  /** Flips isClicked in the cached pages so the row updates immediately. */
  const markClickedInCache = () =>
    queryClient.setQueryData(queryKeys.notifications, (old) =>
      old?.pages
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) =>
                notification.id === id
                  ? { ...notification, isClicked: true }
                  : notification,
              ),
            })),
          }
        : old,
    );

  const handleClick = async () => {
    const parsed = parseNotificationData(data);
    const { postId, commentId } = parsed;
    router.push({ pathname: "/postDetails", params: { postId, commentId } });

    if (!isClicked && id) {
      markClickedInCache();

      const result = await markNotificationAsClicked(id);
      if (!result.success) {
        console.error("Error marking notification as clicked:", result.msg);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !isClicked && styles.notClicked]}
      onPress={handleClick}
    >
      <Avatar size={hp(5)} color={theme.colors.textLight} />

      <View style={styles.nameTitle}>
        <Text style={styles.text}>{sender?.name}</Text>
        <Text style={[styles.text, styles.title]}>{title}</Text>
      </View>

      <Text style={styles.time}>{createdAt}</Text>
    </TouchableOpacity>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
  },
  notClicked: {
    backgroundColor: theme.colors.primaryLight,
  },
  nameTitle: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  title: {
    fontWeight: theme.fonts.medium,
    color: theme.colors.textDark,
  },
  time: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
});
