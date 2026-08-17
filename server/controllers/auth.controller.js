const User = require("../models/user");
const { sendResult } = require("../utils/result");

class AuthController {
  // POST /auth/signup — body: { email, password, name }
  static async signup(req, res) {
    const { email, password, name } = req.body;
    const result = await User.signup({ email, password, name });
    sendResult(res, result, 201);
  }

  // POST /auth/login — body: { email, password }
  static async login(req, res) {
    const { email, password } = req.body;
    const result = await User.login({ email, password });
    sendResult(res, result);
  }
}

module.exports = AuthController;
