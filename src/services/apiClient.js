import { supabase } from "@/lib/supabase";

// Attaches the current Supabase access token. supabase-js refreshes the
// session automatically, so getSession() always returns a valid token while
// the user is signed in.
export async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });
}
