import { hp } from "@/helpers/common";
import { registerPushToken } from "@/services/authService";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import {
  getPushPermissionStatus,
  requestPushPermission,
} from "@/services/notificationPermissions";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const DISMISSED_KEY = "pushPromptDismissed";

/**
 * In-app explainer shown before the OS permission dialog.
 *
 * iOS shows its dialog only once per install, so firing it on launch — as the
 * app used to — spends that single chance on a user who has no idea what is
 * being asked. This card explains first and only calls the OS dialog when the
 * user taps Enable. Dismissal is remembered so it never nags.
 *
 * Renders nothing unless permission is genuinely undetermined.
 */
const PushPermissionPrompt = () => {
  const styles = useStyles();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [status, dismissed] = await Promise.all([
        getPushPermissionStatus(),
        AsyncStorage.getItem(DISMISSED_KEY),
      ]);

      if (cancelled) return;

      // Already granted: register quietly, no UI.
      if (status === "granted") {
        registerPushToken();
        return;
      }

      setVisible(status === "undetermined" && !dismissed);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onEnable = async () => {
    setBusy(true);
    const status = await requestPushPermission();
    setBusy(false);
    setVisible(false);

    if (status === "granted") {
      registerPushToken();
    } else {
      // They said no at the OS level; don't ask again from here.
      AsyncStorage.setItem(DISMISSED_KEY, "1").catch(() => {});
    }
  };

  const onDismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISSED_KEY, "1").catch(() => {});
  };

  if (!visible) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Ionicons
        name="notifications-outline"
        size={hp(3)}
        color={theme.colors.primaryDark}
      />

      <View style={styles.copy}>
        <Text style={styles.title}>Stay in the loop</Text>
        <Text style={styles.body}>
          Get notified when someone likes or comments on your posts.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onDismiss}
          style={styles.secondary}
          accessibilityRole="button"
          accessibilityLabel="Not now"
          hitSlop={8}
        >
          <Text style={styles.secondaryText}>Not now</Text>
        </Pressable>

        <Pressable
          onPress={onEnable}
          disabled={busy}
          style={[styles.primary, busy && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Enable notifications"
          hitSlop={8}
        >
          <Text style={styles.primaryText}>Enable</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PushPermissionPrompt;

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginTop: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    backgroundColor: theme.colors.surface,
    flexWrap: "wrap",
  },
  copy: {
    flex: 1,
    minWidth: hp(20),
    gap: 2,
  },
  title: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  body: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryText: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },
  primary: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.onPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
}));
