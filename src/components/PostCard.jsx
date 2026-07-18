import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = currentUser?.id === item?.userId;

  const createdAt = moment(item?.created_at).format("MMM D");

  const openPostDetails = () => {
    router.push({ pathname: "postDetails", params: { postId: item?.id } });
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert("Confirm", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel", onPress: () => {} },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete?.(item),
      },
    ]);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(item);
  };

  const liked = false; // Placeholder for like status, can be replaced with actual logic
  let likes = []; // Placeholder for likes, can be replaced with actual logic
  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      <View style={styles.header}>
        {/* user info and post time */}
        <TouchableOpacity style={styles.userInfo} onPress={openPostDetails}>
          <Ionicons
            name="person-circle-outline"
            size={hp(5)}
            color={theme.colors.textLight}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item?.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </TouchableOpacity>

        {/* three dot menu */}
        {isOwner && (
          <View>
            <Pressable onPress={() => setShowMenu((prev) => !prev)}>
              <Ionicons
                name="ellipsis-horizontal"
                size={hp(2.8)}
                color={theme.colors.textLight}
              />
            </Pressable>

            {showMenu && (
              <View style={styles.menu}>
                <Pressable style={styles.menuItem} onPress={handleEdit}>
                  <Ionicons
                    name="pencil-outline"
                    size={hp(2.2)}
                    color={theme.colors.text}
                  />
                  <Text style={styles.menuText}>Edit</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={handleDelete}>
                  <Ionicons
                    name="trash-outline"
                    size={hp(2.2)}
                    color="#ff3333"
                  />
                  <Text style={[styles.menuText, { color: "#ff3333" }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {/* post body */}
      <View onPress={openPostDetails} style={styles.body}>
        {item?.body && <Text style={styles.content}>{item.body}</Text>}
      </View>

      {/* footer actions */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity>
            <Ionicons
              name="heart-outline"
              size={hp(2.6)}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{item?.likes?.length ?? 0}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity>
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
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
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
});
