import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const Home = () => {
  const router = useRouter();

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Social App</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => router.push("notifications")}>
              <Ionicons
                name="notifications-outline"
                size={hp(3.2)}
                color={theme.colors.text}
              />
            </Pressable>

            <Pressable onPress={() => router.push("newPost")}>
              <Ionicons
                name="add-circle-outline"
                size={hp(3.2)}
                color={theme.colors.text}
              />
            </Pressable>

            <Pressable onPress={() => router.push("profile")}>
              <Ionicons
                name="person-circle-outline"
                size={hp(3.2)}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
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
});
