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
}

module.exports = UserController;
