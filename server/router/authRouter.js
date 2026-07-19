const express = require("express");
const User = require("../models/User.js");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const result = await User.signup(req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await User.login(req.body);
    res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
});

module.exports = router;
