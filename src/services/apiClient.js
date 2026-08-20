import { supabase } from "@/lib/supabase";

// Attaches the current Supabase access token. supabase-js refreshes the
// session automatically, so getSession() always returns a valid token while
// the user is signed in.
export async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });

  // We sent a token the server no longer accepts (revoked / stale session):
  // end the session. The SIGNED_OUT listener in _layout resets the auth
  // context and navigates to /welcome, so every screen recovers the same way.
  if (res.status === 401 && token) {
    supabase.auth.signOut().catch(() => {});
  }

  return res;
}
