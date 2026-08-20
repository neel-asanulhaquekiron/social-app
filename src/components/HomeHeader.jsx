import Avatar from "@/components/Avatar";
import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";

const HomeHeader = ({ notificationCount, showFilter, onToggleFilter }) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Social App</Text>
      <View style={styles.icons}>
        <Pressable
          onPress={onToggleFilter}
          accessibilityRole="button"
          accessibilityLabel="Filter posts by username"
          accessibilityState={{ expanded: showFilter }}
          hitSlop={8}
        >
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
          onPress={() => router.push("/notifications")}
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unseen`
              : "Notifications"
          }
          hitSlop={8}
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

        <Pressable
          onPress={() => router.push("/newPost")}
          accessibilityRole="button"
          accessibilityLabel="Create post"
          hitSlop={8}
        >
          <Ionicons
            name="add-circle-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
        >
          <Avatar size={hp(3.2)} color={theme.colors.text} />
        </Pressable>
      </View>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
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
