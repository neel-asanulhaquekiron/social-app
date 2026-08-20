import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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

export const setNotificationHandler = (): void => {
  if (isExpoGoAndroid) {
    console.log(EXPO_GO_ANDROID_MESSAGE);
    return;
  }

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
  await Notifications.setBadgeCountAsync(0);
};

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

/** Reads the current status without ever showing the OS dialog. */
export const getPushPermissionStatus =
  async (): Promise<PushPermissionStatus> => {
    if (isExpoGoAndroid || !Device.isDevice) return "denied";

    const { status } = await Notifications.getPermissionsAsync();
    return status as PushPermissionStatus;
  };

/**
 * Shows the OS dialog. iOS only ever shows it once per install, so this must
 * be called from a deliberate user action, after an in-app explanation.
 */
export const requestPushPermission =
  async (): Promise<PushPermissionStatus> => {
    if (isExpoGoAndroid || !Device.isDevice) return "denied";

    const { status } = await Notifications.requestPermissionsAsync();
    return status as PushPermissionStatus;
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
