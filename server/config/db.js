const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const missing = [
  ["SUPABASE_URL", supabaseUrl],
  ["SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey],
  ["SUPABASE_ANON_KEY", supabaseAnonKey],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length) {
  throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
}

// Server-side clients must never persist or auto-refresh a user session:
// supabase-js prefers a stored session's access token over the API key for
// every subsequent request, so calling auth.signIn* on a shared client would
// silently make all later queries run as that user.
const noSession = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

// Data access. Uses the service-role key (bypasses RLS). Never call
// `supabase.auth.signIn*` / `signUp` on this client.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, noSession);

// GoTrue-only client (signUp / signInWithPassword). Uses the anon /
// publishable key, exactly like the mobile app would.
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, noSession);

module.exports = supabase;
module.exports.supabase = supabase;
module.exports.supabaseAuth = supabaseAuth;
