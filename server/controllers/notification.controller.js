const Notification = require("../models/notification.js");
const { fail, sendResult } = require("../utils/result");

class NotificationController {
  // POST /notifications — sender is always the authenticated user.
  static async create(req, res) {
    const { receiverId, title, data } = req.body;
    const senderId = req.user.id;

    if (receiverId === senderId) {
      return sendResult(res, fail("Cannot notify yourself"));
    }

    const result = await Notification.createNotification({
      senderId,
      receiverId,
      title,
      data: data ?? null,
      isSeen: false,
      isClicked: false,
    });
    sendResult(res, result, 201);
  }

  // PATCH /notifications/:notificationId/clicked — only the receiver may mark it.
  static async markClicked(req, res) {
    const result = await Notification.markNotificationAsClicked(
      req.params.notificationId,
      req.user.id,
    );
    sendResult(res, result);
  }

  // GET /notifications/unseen-count — for the authenticated user.
  static async unseenCount(req, res) {
    const result = await Notification.getUnseenNotificationCount(req.user.id);
    sendResult(res, result);
  }

  // GET /notifications — for the authenticated user.
  static async list(req, res) {
    const result = await Notification.fetchNotifications(req.user.id);
    sendResult(res, result);
  }
}

module.exports = NotificationController;
