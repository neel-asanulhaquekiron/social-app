const User = require("../models/user");
const { sendResult } = require("../utils/result");

class UserController {
  // GET /users/me — full profile of the caller.
  static async getMe(req, res) {
    let result = await User.getUserData(req.user.id, { includePrivate: true });

    // The DB trigger creates the profile row on signup; if it's ever missing,
    // recreate it from the verified token claims instead of failing.
    if (!result.success && result.code === "not_found") {
      result = await User.ensureProfile({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      });
    }

    sendResult(res, result);
  }

  // GET /users/:userId — public profile only (no email / pushToken).
  static async getUserData(req, res) {
    const { userId } = req.params;
    const result = await User.getUserData(userId, {
      includePrivate: userId === req.user.id,
    });
    sendResult(res, result);
  }

  // DELETE /users/pushToken — clears the authenticated user's push token.
  static async unregisterPushToken(req, res) {
    const result = await User.unregisterPushToken(req.user.id);
    sendResult(res, result);
  }

  // POST /users/registerPushToken — always bound to the authenticated user.
  static async registerPushToken(req, res) {
    const result = await User.registerPushToken(
      req.user.id,
      req.body.pushToken,
    );
    sendResult(res, result);
  }
}

module.exports = UserController;
