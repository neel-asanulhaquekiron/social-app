import { theme } from "@/constants/theme";
import { hp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  showLogOutButton = false,
  onLogOut,
}) => {
  const router = useRouter();

  const handleLogOutPress = () => {
    if (!onLogOut) {
      return;
    }

    onLogOut();
  };

  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="chevron-back-outline"
            size={hp(3.2)}
            color={theme.colors.text}
          />
        </Pressable>
      )}

      {title && <Text style={styles.title}>{title}</Text>}

      {showLogOutButton && (
        <Pressable onPress={handleLogOutPress} style={styles.logoutButton}>
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

const styles = StyleSheet.create({
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
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    padding: 5,
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: "#ffe8e8",
    zIndex: 10,
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: "center",
    flex: 1,
  },
});
