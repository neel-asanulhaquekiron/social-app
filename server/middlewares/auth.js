const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired token",
    });
  }
};

module.exports = auth;
