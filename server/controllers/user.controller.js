const User = require("../models/user");

class UserController {
  // GET /users/me — full profile of the caller.
  static async getMe(req, res) {
    try {
      const result = await User.getUserData(req.user.id, { includePrivate: true });
      res.status(result.success ? 200 : result.notFound ? 404 : 400).json(result);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ success: false, msg: "Something went wrong" });
    }
  }

  // GET /users/:userId — public profile only (no email / pushToken).
  static async getUserData(req, res) {
    try {
      const { userId } = req.params;

      const result = await User.getUserData(userId, {
        includePrivate: userId === req.user.id,
      });

      res.status(result.success ? 200 : result.notFound ? 404 : 400).json(result);
    } catch (error) {
      console.error("Error fetching user:", error);

      res.status(500).json({
        success: false,
        msg: error.message || "Something went wrong",
      });
    }
  }

  static async registerPushToken(req, res) {
    try {
      const { pushToken } = req.body;

      // Always bind the token to the authenticated user, never a body-supplied id.
      const result = await User.registerPushToken(req.user.id, pushToken);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Error registering push token:", error);

      res.status(500).json({
        success: false,
        msg: error.message || "Something went wrong",
      });
    }
  }
}

module.exports = UserController;
