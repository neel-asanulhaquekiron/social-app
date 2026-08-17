const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const asyncHandler = require("../utils/asyncHandler");
const AuthValidator = require("../validators/validator.auth");
const AuthController = require("../controllers/auth.controller");

router.post(
  "/signup",
  validate(AuthValidator.signupSchema),
  asyncHandler(AuthController.signup),
);

router.post(
  "/login",
  validate(AuthValidator.loginSchema),
  asyncHandler(AuthController.login),
);

module.exports = router;
