const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const User = require("../models/user.js");

const UserValidator = require("../validators/validator.user");
const UserController = require("../controllers/user.controller");

router.get(
  "/:userId",
  auth,
  validate(UserValidator.userIdParamsSchema, "params"),
  UserController.getUserData,
);

router.post("/registerPushToken", async (req, res) => {
  const { userId, pushToken } = req.body;
  const result = await User.registerPushToken(userId, pushToken);
  res.json(result);
});

module.exports = router;
