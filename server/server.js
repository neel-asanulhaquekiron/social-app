// Entry point: start the app built in app.js and handle process lifecycle.
const env = require("./config/env.js");
const logger = require("./config/logger.js");
const app = require("./app.js");

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "server listening");
});

// Graceful shutdown (Render sends SIGTERM on deploys).
const shutdown = (signal) => {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled promise rejection");
});

module.exports = server;
