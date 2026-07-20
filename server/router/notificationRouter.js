const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.js");

router.post("/", async (req, res) => {
  const notificationData = req.body;
  const result = await Notification.createNotification(notificationData);
  res.json(result);
});

router.patch("/:notificationId", async (req, res) => {
  const notificationId = req.params.notificationId;
  const result = await Notification.markNotificationAsClicked(notificationId);
  res.json(result);
});

router.get("/:receiverId", async (req, res) => {
  const receiverId = req.params.receiverId;
  const result = await Notification.fetchNotifications(receiverId);
  res.json(result);
});

module.exports = router;
