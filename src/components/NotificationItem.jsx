import Avatar from "@/components/Avatar";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { markNotificationAsClicked } from "@/services/notificationServices";
import moment from "moment";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NotificationItem = ({ item, router, setNotifications }) => {
  const { id, title, data, sender, created_at, isClicked } = item || {};
  const createdAt = moment(created_at).format("MMM D");

  const handleClick = async () => {
    let { postId, commentId } = JSON.parse(data ?? "{}");
    router.push({ pathname: "postDetails", params: { postId, commentId } });
    if (!isClicked && id) {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, isClicked: true }
            : notification,
        ),
      );
      try {
        await markNotificationAsClicked(id);
      } catch (error) {
        console.error("Error marking notification as clicked:", error);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !isClicked && styles.notClicked]}
      onPress={handleClick}
    >
      <Avatar
        uri={sender?.image}
        size={hp(5)}
        rounded={theme.radius?.md ?? 12}
      />

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
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors?.gray ?? "#e5e5e5",
    borderRadius: theme.radius?.lg ?? 16,
    marginBottom: 12,
  },
  notClicked: {
    backgroundColor: theme.colors.primaryLight ?? "#e0f7fa",
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
