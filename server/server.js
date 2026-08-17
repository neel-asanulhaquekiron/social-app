// Load + validate env first; everything else may read process.env safely.
const env = require("./config/env.js");
const logger = require("./config/logger.js");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

const postRouter = require("./router/postRouter.js");
const userRouter = require("./router/userRouter.js");
const notificationRouter = require("./router/notificationRouter.js");
const authRouter = require("./router/authRouter.js");
const { notFound, errorHandler } = require("./middlewares/errorHandler.js");

const app = express();

// Render (and most PaaS) sit behind a reverse proxy; needed for correct
// client IPs in rate limiting and req.ip.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());

// Native apps send no Origin header and pass through; browsers (Expo web,
// admin tools) must be listed in CORS_ORIGINS.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/health" },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

const jsonLimitResponse = {
  success: false,
  msg: "Too many requests, please try again later",
  code: "rate_limited",
};

// General limiter (per IP) for everything.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: jsonLimitResponse,
  }),
);

// Tight limiter for credential endpoints: auth is proxied through this server,
// so GoTrue only sees our IP — we must throttle brute force ourselves.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonLimitResponse,
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

app.use("/auth", authLimiter, authRouter);
app.use("/posts", postRouter);
app.use("/users", userRouter);
app.use("/notifications", notificationRouter);

// Always answer with JSON — no Express HTML pages for unknown routes or errors.
app.use(notFound);
app.use(errorHandler);

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
