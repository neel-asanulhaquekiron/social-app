import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { handleLogOut } from "@/utils/logOut";
import { StyleSheet, Text, View } from "react-native";

const Profile = () => {
  const { user } = useAuth();

  return (
    <ScreenWrapper bg="white">
      <UserHeader user={user} handleLogout={handleLogOut} />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, handleLogout }) => {
  const { name, email } = user || {};
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header
          title="Profile"
          showBackButton={true}
          showLogOutButton={true}
          onLogOut={handleLogout}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.avatarContainer}>
          <Avatar size={hp(12)} color={theme.colors.text} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
    padding: 6,
    borderRadius: theme.radius?.sm ?? 8,
    backgroundColor: "#ffe8e8",
  },
  body: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  info: {
    alignItems: "center",
    gap: 2,
  },
  name: {
    fontSize: hp(2.6),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  email: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
});
