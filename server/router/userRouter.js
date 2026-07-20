const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const UserValidator = require("../validators/validator.user");
const UserController = require("../controllers/user.controller");

router.get(
  "/:userId",
  auth,
  validate(UserValidator.userIdParamsSchema, "params"),
  UserController.getUserData,
);

module.exports = router;
