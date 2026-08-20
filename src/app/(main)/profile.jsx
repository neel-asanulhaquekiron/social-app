import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/context/AuthContext";
import { hp, wp } from "@/helpers/common";
import { getPushPermissionStatus } from "@/services/notificationPermissions";
import { handleLogOut } from "@/utils/logOut";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

const Profile = () => {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <UserHeader user={user} handleLogout={handleLogOut} />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, handleLogout }) => {
  const styles = useStyles();
  const theme = useTheme();
  const { name, email } = user || {};
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header
          title="My Profile"
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

        <NotificationSetting />
      </View>
    </View>
  );
};

/**
 * Once notifications are denied, the OS dialog can never be shown again from
 * inside the app — the only route back is system settings, so offer it here
 * instead of leaving the user with silently broken notifications.
 */
const NotificationSetting = () => {
  const styles = useStyles();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPushPermissionStatus().then((value) => {
      if (!cancelled) setStatus(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status !== "denied") return null;

  return (
    <View style={styles.notificationRow}>
      <Text style={styles.notificationText}>Notifications are turned off</Text>
      <Pressable
        onPress={() => Linking.openSettings()}
        style={styles.settingsButton}
        accessibilityRole="button"
        accessibilityLabel="Open notification settings"
        hitSlop={8}
      >
        <Text style={styles.settingsText}>Open settings</Text>
      </Pressable>
    </View>
  );
};

export default Profile;

const useStyles = makeStyles((theme) => ({
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
  body: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  notificationRow: {
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  notificationText: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray,
  },
  settingsText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text,
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
}));
