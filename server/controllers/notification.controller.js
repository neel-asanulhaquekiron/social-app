const Notification = require("../models/notification.js");
const { sendResult } = require("../utils/result");

class NotificationController {
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

  // POST /notifications/mark-seen — for the authenticated user.
  static async markAllSeen(req, res) {
    const result = await Notification.markAllSeen(req.user.id);
    sendResult(res, result);
  }

  // GET /notifications?limit=&cursor= — for the authenticated user.
  static async list(req, res) {
    const { limit = 20, cursor = null } = req.validated?.query ?? {};
    const result = await Notification.fetchNotifications(req.user.id, {
      limit,
      cursor,
    });
    sendResult(res, result);
  }
}

module.exports = NotificationController;
