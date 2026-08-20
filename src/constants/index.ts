// EXPO_PUBLIC_* values are inlined by Babel at build time, so they must be
// read as literal property accesses — `process.env[name]` does not work.
const required = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name);

// Fail loudly at startup instead of surfacing later as "Network request
// failed" against the URL "undefined/posts".
if (missing.length > 0) {
  throw new Error(
    `Missing environment variables: ${missing.join(", ")}. ` +
      "Copy .env.example to .env, fill them in, then restart with a cleared " +
      "cache (npx expo start -c) — EXPO_PUBLIC_* values are baked in at build time.",
  );
}

export const supabaseUrl = required.EXPO_PUBLIC_SUPABASE_URL as string;
export const supabasePublishableKey =
  required.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
// Trailing slash trimmed so `${API_BASE_URL}/posts` can never become "//posts".
export const API_BASE_URL = (
  required.EXPO_PUBLIC_API_BASE_URL as string
).replace(/\/+$/, "");
