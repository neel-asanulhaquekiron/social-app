const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

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
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  noSession,
);

module.exports = supabase;
module.exports.supabase = supabase;
