import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";

const TIMEOUT_MS = 15000;

const GENERIC_ERROR = "Something went wrong";

/**
 * Single entry point for every call to our API.
 *
 * Always resolves to `{ success, data?, msg?, status?, code? }` — the same
 * shape the server sends — so callers never need their own try/catch and a
 * 502 HTML page from Render can't surface as "JSON Parse error".
 */
const request = async (method, path, body) => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  // AbortSignal.timeout() is not available on every React Native runtime.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (error) {
    console.error(`[api] ${method} ${path} failed:`, error);
    return {
      success: false,
      msg:
        error.name === "AbortError"
          ? "The request timed out — check your connection and try again"
          : "Could not reach the server — check your connection",
    };
  } finally {
    clearTimeout(timeout);
  }

  // The token was rejected (revoked or stale session): end it. The SIGNED_OUT
  // listener resets the auth context and returns to /welcome.
  if (res.status === 401 && token) {
    supabase.auth.signOut().catch(() => {});
  }

  const text = await res.text().catch(() => "");
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Proxy error pages, gateway HTML, empty bodies…
      console.error(
        `[api] ${method} ${path} returned non-JSON (HTTP ${res.status}):`,
        text.slice(0, 200),
      );
    }
  }

  if (!res.ok) {
    return {
      success: false,
      msg: parsed?.msg || `Request failed (HTTP ${res.status})`,
      status: res.status,
      ...(parsed?.code && { code: parsed.code }),
    };
  }

  if (!parsed) {
    return { success: false, msg: GENERIC_ERROR, status: res.status };
  }

  return parsed;
};

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;
