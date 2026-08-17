const User = require("../models/user");

class UserController {
  static async getUserData(req, res) {
    try {
      const { userId } = req.params;

      const result = await User.getUserData(userId);

      res.json(result);
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
      const { userId, pushToken } = req.body;

      const result = await User.registerPushToken(userId, pushToken);

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
