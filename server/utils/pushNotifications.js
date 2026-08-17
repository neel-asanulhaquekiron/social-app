const { Expo } = require("expo-server-sdk");
const supabase = require("../config/db.js");
const logger = require("../config/logger");

const expo = new Expo();

class PushNotificationService {
  static async sendPushNotification(pushToken, title, body, data = {}) {
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.warn("invalid Expo push token supplied");
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
          logger.error(
            { error: ticket.details?.error, message: ticket.message },
            "push ticket error",
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
      logger.error({ err: error }, "error sending push notification");
    }
  }
}

module.exports = PushNotificationService;
