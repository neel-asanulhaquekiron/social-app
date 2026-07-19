import Avatar from "@/components/Avatar";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const CommentItem = ({
  item,
  canDelete = false,
  onDelete,
  highlight = false,
}) => {
  const createdAt = moment(item?.created_at).format("MMM D");

  const handleDelete = () => {
    Alert.alert("Confirm", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel", onPress: () => {} },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete?.(item),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Avatar
        uri={item?.user?.image}
        size={hp(4)}
        rounded={theme.radius?.md ?? 12}
      />
      <View style={[styles.bubble, highlight && styles.highlight]}>
        <View style={styles.header}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{item?.user?.name}</Text>
            <Text style={styles.time}>•</Text>
            <Text style={styles.time}>{createdAt}</Text>
          </View>
          {canDelete && (
            <Pressable onPress={handleDelete} style={styles.deleteIcon}>
              <Ionicons name="trash-outline" size={hp(2)} color="#ff3333" />
            </Pressable>
          )}
        </View>
        <Text style={styles.text}>{item?.text}</Text>
      </View>
    </View>
  );
};

export default CommentItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  highlight: {
    borderWidth: 1,
    backgroundColor: "white",
    borderColor: theme.colors.dark,
    shadowColor: theme.colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  bubble: {
    flex: 1,
    backgroundColor: theme.colors?.gray ?? "#f2f2f2",
    borderRadius: theme.radius?.md ?? 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  time: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  text: {
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  deleteIcon: {
    paddingTop: 4,
  },
});
