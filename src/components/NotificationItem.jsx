import Avatar from "@/components/Avatar";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import moment from "moment";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NotificationItem = ({ item, router }) => {
  const createdAt = moment(item?.created_at).format("MMM D");

  const handleClick = () => {
    let { postId, commentId } = JSON.parse(item?.data ?? "{}");
    router.push({ pathname: "postDetails", params: { postId, commentId } });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleClick}>
      <Avatar
        uri={item?.sender?.image}
        size={hp(5)}
        rounded={theme.radius?.md ?? 12}
      />

      <View style={styles.nameTitle}>
        <Text style={styles.text}>{item?.sender?.name}</Text>
        <Text style={[styles.text, styles.title]}>{item?.title}</Text>
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
