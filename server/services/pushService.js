const { Expo } = require("expo-server-sdk");
const { supabase } = require("../config/db.js");
const logger = require("../config/logger");

const expo = new Expo();

// Expo recommends checking receipts ~15 minutes after sending; errors such as
// DeviceNotRegistered mostly surface there, not in the immediate tickets.
const RECEIPT_CHECK_DELAY_MS = 15 * 60 * 1000;

const clearDeadToken = async (pushToken) => {
  const { error } = await supabase
    .from("users")
    .update({ pushToken: null })
    .eq("pushToken", pushToken);
  if (error) logger.error({ err: error }, "failed to clear dead push token");
  else logger.info("cleared unregistered push token");
};

const checkReceipts = async (ticketIdToToken) => {
  const ids = Object.keys(ticketIdToToken);
  if (!ids.length) return;
  try {
    for (const chunk of expo.chunkPushNotificationReceiptIds(ids)) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [id, receipt] of Object.entries(receipts)) {
        if (receipt.status !== "error") continue;
        logger.error(
          { error: receipt.details?.error, message: receipt.message },
          "push receipt error",
        );
        if (receipt.details?.error === "DeviceNotRegistered") {
          await clearDeadToken(ticketIdToToken[id]);
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, "error fetching push receipts");
  }
};

/**
 * Send push notifications. `messages` = [{ to, title, body, data }].
 * Never throws; logs ticket errors, clears dead tokens, and schedules a
 * receipt check.
 */
const sendPushNotifications = async (messages) => {
  const valid = messages
    .filter((m) => {
      if (Expo.isExpoPushToken(m.to)) return true;
      logger.warn("skipping invalid Expo push token");
      return false;
    })
    .map((m) => ({
      sound: "default",
      channelId: "default",
      priority: "high",
      ...m,
    }));

  if (!valid.length) return;

  const ticketIdToToken = {};

  for (const chunk of expo.chunkPushNotifications(valid)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        const token = chunk[i].to;
        if (ticket.status === "ok") {
          ticketIdToToken[ticket.id] = token;
          return;
        }
        logger.error(
          { error: ticket.details?.error, message: ticket.message },
          "push ticket error",
        );
        if (ticket.details?.error === "DeviceNotRegistered") {
          clearDeadToken(token);
        }
      });
    } catch (error) {
      logger.error({ err: error }, "error sending push notifications");
    }
  }

  if (Object.keys(ticketIdToToken).length) {
    setTimeout(
      () => checkReceipts(ticketIdToToken),
      RECEIPT_CHECK_DELAY_MS,
    ).unref();
  }
};

module.exports = { sendPushNotifications, checkReceipts };
