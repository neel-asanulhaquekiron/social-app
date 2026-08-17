const { isDev } = require("../utils/result");

// 404 for anything no router matched — JSON, not Express's HTML page.
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    msg: `Route not found: ${req.method} ${req.originalUrl}`,
    code: "not_found",
  });
};

// Central error handler: always JSON, never a stack trace or library message
// in production. Handles body-parser errors (malformed JSON) as 400.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, msg: "Malformed JSON body", code: "bad_request" });
  }

  if (err?.type === "entity.too.large") {
    return res
      .status(413)
      .json({ success: false, msg: "Request body too large", code: "bad_request" });
  }

  const status = Number.isInteger(err?.status) ? err.status : 500;
  (req.log || require("../config/logger")).error({ err }, `unhandled error on ${req.method} ${req.originalUrl}`);

  res.status(status).json({
    success: false,
    msg:
      status < 500 || isDev
        ? err?.message || "Request failed"
        : "Something went wrong",
    code: status < 500 ? "bad_request" : "server_error",
  });
};

module.exports = { notFound, errorHandler };
