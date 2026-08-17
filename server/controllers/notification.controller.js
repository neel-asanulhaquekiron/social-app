const Notification = require("../models/notification.js");

const handleError = (res, context, error) => {
  console.error(`Error ${context}:`, error);
  res.status(500).json({ success: false, msg: "Something went wrong" });
};

class NotificationController {
  // POST /notifications — sender is always the authenticated user.
  static async create(req, res) {
    try {
      const { receiverId, title, data } = req.body;
      const senderId = req.user.id;

      if (receiverId === senderId) {
        return res
          .status(400)
          .json({ success: false, msg: "Cannot notify yourself" });
      }

      const result = await Notification.createNotification({
        senderId,
        receiverId,
        title,
        data: data ?? null,
        isSeen: false,
        isClicked: false,
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      handleError(res, "creating notification", error);
    }
  }

  // PATCH /notifications/:notificationId/clicked — only the receiver may mark it.
  static async markClicked(req, res) {
    try {
      const { notificationId } = req.params;
      const result = await Notification.markNotificationAsClicked(
        notificationId,
        req.user.id,
      );

      if (!result.success) {
        return res.status(result.notFound ? 404 : 400).json(result);
      }
      res.json(result);
    } catch (error) {
      handleError(res, "marking notification as clicked", error);
    }
  }

  // GET /notifications/unseen-count — for the authenticated user.
  static async unseenCount(req, res) {
    try {
      const result = await Notification.getUnseenNotificationCount(
        req.user.id,
      );
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      handleError(res, "fetching unseen notification count", error);
    }
  }

  // GET /notifications — for the authenticated user.
  static async list(req, res) {
    try {
      const result = await Notification.fetchNotifications(req.user.id);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      handleError(res, "fetching notifications", error);
    }
  }
}

module.exports = NotificationController;
