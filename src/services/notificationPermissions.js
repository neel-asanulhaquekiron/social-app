import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";

let Notifications = null;

const getNotifications = async () => {
  if (!Notifications) {
    const mod = await import("expo-notifications");
    Notifications = mod;
  }
  return Notifications;
};

export const setNotificationHandler = async () => {
  if (isExpoGo && Platform.OS === "android") {
    console.log(
      "Push notifications unavailable in Expo Go on Android (SDK 53+)",
    );
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

/**
 * Subscribes to notification tap events (app in foreground, background, or
 * cold-started from a notification) and navigates to the related post.
 * Returns an unsubscribe function.
 */
export const addNotificationResponseListener = async (onResponse) => {
  if (isExpoGo && Platform.OS === "android") {
    return () => {};
  }
  const Notifications = await getNotifications();

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onResponse(response?.notification?.request?.content?.data ?? {});
    },
  );

  // Handle the case where the app was launched by tapping a notification.
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    onResponse(lastResponse?.notification?.request?.content?.data ?? {});
  }

  return () => subscription.remove();
};

export const registerForPushNotificationsAsync = async () => {
  if (isExpoGo && Platform.OS === "android") {
    console.log(
      "Push notifications unavailable in Expo Go on Android (SDK 53+)",
    );
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
    Constants?.easConfig?.projectId;

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
