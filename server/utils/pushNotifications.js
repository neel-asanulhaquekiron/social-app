const { Expo } = require("expo-server-sdk");

const expo = new Expo();

class PushNotificationService {
  static async sendPushNotification(pushToken, title, body, data = {}) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Invalid Expo push token: ${pushToken}`);
      return;
    }

    const message = {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    };

    try {
      const receipts = await expo.sendPushNotificationsAsync([message]);
      console.log("Push notification sent:", receipts);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
}

module.exports = PushNotificationService;
