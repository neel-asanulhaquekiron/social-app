const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const NotificationValidator = require("../validators/validator.notification");
const NotificationController = require("../controllers/notification.controller");

// Every notification route is scoped to the authenticated user (req.user.id);
// callers never pass a receiverId in the URL.
router.use(auth);

router.get("/unseen-count", NotificationController.unseenCount);

router.get("/", NotificationController.list);

router.patch(
  "/:notificationId/clicked",
  validate(NotificationValidator.notificationIdParamsSchema, "params"),
  asyncHandler(NotificationController.markClicked),
);

module.exports = router;
