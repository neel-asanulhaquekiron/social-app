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

export const registerForPushNotificationsAsync = async (): Promise<
  string | null
> => {
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

  if (existingStatus !== "granted") {
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
