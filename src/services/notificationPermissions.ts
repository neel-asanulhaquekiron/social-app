import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Expo Go reports "storeClient"; development builds (expo-dev-client) and
// production builds report "bare"/"standalone" — so push keeps working in dev
// builds, unlike a plain `executionEnvironment !== standalone` check.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Remote push notifications were removed from Expo Go on Android in SDK 53.
export const isExpoGoAndroid = isExpoGo && Platform.OS === "android";

const EXPO_GO_ANDROID_MESSAGE =
  "Push notifications unavailable in Expo Go on Android (SDK 53+)";

/**
 * expo-notifications must never be imported at module scope: in Expo Go on
 * Android it *throws on import*. This module is reached from authService ->
 * AuthContext -> every screen, so a module-scope import took the whole app
 * down there. Each entry point below is guarded by isExpoGoAndroid, so the
 * import only ever runs where the module is usable.
 */
type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null = null;

const getNotifications = async (): Promise<NotificationsModule> => {
  if (!cached) {
    cached = await import("expo-notifications");
  }
  return cached;
};

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

export type PushPermission = {
  status: PushPermissionStatus;
  /** False once the OS will no longer show the dialog — settings is the only way back. */
  canAskAgain: boolean;
  /** True when this device cannot do push at all (emulator, Expo Go on Android). */
  unsupported: boolean;
};

/**
 * Reads the current permission without ever showing the OS dialog.
 *
 * `canAskAgain` matters more than `status` here. On Android, getPermissionsAsync
 * never reports "undetermined": pre-13 it is "granted", and on 13+ it is
 * "denied" from the very first launch because POST_NOTIFICATIONS starts
 * ungranted. Keying the explainer off "undetermined" therefore meant it never
 * appeared on Android at all.
 */
export const getPushPermission = async (): Promise<PushPermission> => {
  if (isExpoGoAndroid || !Device.isDevice) {
    return { status: "denied", canAskAgain: false, unsupported: true };
  }

  const Notifications = await getNotifications();
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();

  return {
    status: status as PushPermissionStatus,
    canAskAgain: !!canAskAgain,
    unsupported: false,
  };
};

/** Convenience wrapper for callers that only care about the status. */
export const getPushPermissionStatus =
  async (): Promise<PushPermissionStatus> => (await getPushPermission()).status;

/**
 * Shows the OS dialog. iOS only ever shows it once per install, so this must
 * be called from a deliberate user action, after an in-app explanation.
 */
export const requestPushPermission =
  async (): Promise<PushPermissionStatus> => {
    if (isExpoGoAndroid || !Device.isDevice) return "denied";

    const Notifications = await getNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    return status as PushPermissionStatus;
  };

export const setNotificationHandler = async (): Promise<void> => {
  if (isExpoGoAndroid) {
    console.log(EXPO_GO_ANDROID_MESSAGE);
    return;
  }

  const Notifications = await getNotifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const clearNotificationBadge = async (): Promise<void> => {
  if (isExpoGoAndroid) return;

  const Notifications = await getNotifications();
  await Notifications.setBadgeCountAsync(0);
};

/**
 * Returns an Expo push token, or null.
 *
 * By default this never prompts: it only produces a token when permission has
 * already been granted. Pass `promptIfNeeded` from a screen that has just
 * explained why notifications are useful.
 */
export const registerForPushNotificationsAsync = async ({
  promptIfNeeded = false,
}: { promptIfNeeded?: boolean } = {}): Promise<string | null> => {
  if (isExpoGoAndroid) {
    console.log(EXPO_GO_ANDROID_MESSAGE);
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const Notifications = await getNotifications();

  // On Android the channel must exist before requesting a token.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Only ask when a caller explicitly opted in to asking — otherwise a cold
  // start would burn the single prompt iOS allows.
  if (existingStatus !== "granted") {
    if (!promptIfNeeded) return null;

    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  if (!projectId) {
    console.error("Missing EAS projectId; cannot get Expo push token");
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenResponse.data;
  } catch (error) {
    // On Android this typically means google-services.json / FCM is not
    // configured in the native build.
    console.error("Error getting Expo push token:", error);
    return null;
  }
};
