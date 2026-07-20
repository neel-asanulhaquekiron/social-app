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
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
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

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = "65ddd384-8c0b-48f3-9b2e-37ec71acb77a";
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenResponse.data;
};
