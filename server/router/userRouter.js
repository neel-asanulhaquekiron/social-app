const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;
  const result = await User.getUserData(userId);
  res.json(result);
});

module.exports = router;
