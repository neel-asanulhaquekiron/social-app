import { hp } from "@/helpers/common";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  showLogOutButton = false,
  onLogOut,
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const router = useRouter();

  const handleLogOutPress = () => {
    if (!onLogOut) {
      return;
    }

    onLogOut();
  };

  // Opened straight from a notification tap there may be nothing to go back
  // to, and router.back() would be a no-op that traps the user.
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  };

  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <Pressable
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
        </Pressable>
      )}

      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}

      {showLogOutButton && (
        <Pressable
          onPress={handleLogOutPress}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={12}
        >
          <Ionicons
            name="log-out-outline"
            size={hp(3.2)}
            color={theme.colors.error}
          />
        </Pressable>
      )}
    </View>
  );
};

export default Header;

const useStyles = makeStyles((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.errorSurface,
    zIndex: 10,
  },
  title: {
    // The back and logout buttons are absolutely positioned, so reserve room
    // for them; without this a long title ran underneath.
    paddingHorizontal: hp(5),
    fontSize: hp(2.7),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: "center",
    flex: 1,
  },
}));
