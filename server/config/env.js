// Loads .env (for local dev) and validates every variable the server needs.
// Must be required before anything else so process.env is complete and the
// process fails fast — with a clear message — instead of crashing later.
require("dotenv").config({ quiet: true });

const { z } = require("zod");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("production"),
  PORT: z.coerce.number().int().positive().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Comma-separated list of allowed browser origins (Expo web / admin tools).
  // Native apps do not send an Origin header and are unaffected.
  CORS_ORIGINS: z.string().optional().default(""),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([key, msgs]) => `  - ${key}: ${msgs.join(", ")}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`Invalid or missing environment variables:\n${details}`);
  process.exit(1);
}

const env = parsed.data;

module.exports = {
  ...env,
  isProd: env.NODE_ENV === "production",
  isDev: env.NODE_ENV === "development" || env.NODE_ENV === "test",
  corsOrigins: env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
