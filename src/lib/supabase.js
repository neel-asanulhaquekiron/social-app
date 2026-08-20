import { supabasePublishableKey, supabaseUrl } from "@/constants";
import { LargeSecureStore } from "@/lib/largeSecureStore";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // Encrypted at rest: AES key in SecureStore, ciphertext in AsyncStorage.
    ...(Platform.OS !== "web" ? { storage: new LargeSecureStore() } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

/** Lives here, not in a service, so every service can use it without one
 * feature module importing another just for a teardown helper. */
export const unsubscribeFromChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

/**
 * Status handler for `channel.subscribe()`. Without one, a channel that fails
 * to join stays silent forever and looks exactly like "nothing happened yet".
 */
export const channelStatusLogger = (label) => (status, error) => {
  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
    console.warn(
      `[realtime] ${label}: ${status}${error ? ` — ${error.message}` : ""}`,
    );
    return;
  }

  if (__DEV__) {
    console.log(`[realtime] ${label}: ${status}`);
  }
};

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
