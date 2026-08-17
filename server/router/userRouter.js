const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const UserValidator = require("../validators/validator.user");
const UserController = require("../controllers/user.controller");

router.post(
  "/registerPushToken",
  auth,
  validate(UserValidator.registerPushTokenSchema),
  asyncHandler(UserController.registerPushToken),
);

router.get("/me", auth, UserController.getMe);

router.get(
  "/:userId",
  auth,
  validate(UserValidator.userIdParamsSchema, "params"),
  asyncHandler(UserController.getUserData),
);

module.exports = router;
