const { Expo } = require("expo-server-sdk");
const supabase = require("../config/db.js");

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
      channelId: "default",
    };

    try {
      const tickets = await expo.sendPushNotificationsAsync([message]);

      for (const ticket of tickets) {
        if (ticket.status === "error") {
          console.error(
            `Push ticket error (${ticket.details?.error || "unknown"}): ${ticket.message}`,
          );

          if (ticket.details?.error === "DeviceNotRegistered") {
            await supabase
              .from("users")
              .update({ pushToken: null })
              .eq("pushToken", pushToken);
          }
        }
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
}

module.exports = PushNotificationService;
