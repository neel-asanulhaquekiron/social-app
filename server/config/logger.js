const pino = require("pino");
const env = require("./env");

// Pretty output locally, JSON lines in production (Render/log drains).
const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.isDev
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
  // Never log credentials.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.pushToken",
      "*.token",
    ],
    censor: "[redacted]",
  },
});

module.exports = logger;
