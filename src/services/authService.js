import { supabase } from "@/lib/supabase";
import {
  clearNotificationBadge,
  registerForPushNotificationsAsync,
} from "@/services/notificationPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./apiClient";

// Shape the app uses everywhere: { id, email, name }.
export const toAuthUser = (authUser) => ({
  id: authUser.id,
  email: authUser.email,
  name: authUser.user_metadata?.name ?? null,
});

export const signup = async ({ email, password, name }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The DB trigger reads name/email from raw_user_meta_data to create
      // the public.users profile row.
      options: { data: { name, email } },
    });

    if (error) {
      if (error.status === 422 || /already/i.test(error.message)) {
        return {
          success: false,
          msg: "An account with this email already exists",
        };
      }
      if (error.status === 429) {
        return {
          success: false,
          msg: "Too many attempts, please try again later",
        };
      }
      return {
        success: false,
        msg: error.message || "Could not create the account",
      };
    }

    // With email confirmation enabled GoTrue hides duplicates behind a fake
    // success whose user has no identities.
    if (
      Array.isArray(data?.user?.identities) &&
      data.user.identities.length === 0
    ) {
      return {
        success: false,
        msg: "An account with this email already exists",
      };
    }

    if (!data?.session || !data?.user) {
      // Email confirmation flow (not enabled today, but don't dead-end).
      return {
        success: false,
        msg: "Account created — please check your email, then log in",
      };
    }

    return { success: true, user: toAuthUser(data.user) };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const login = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      if (error?.status === 429) {
        return {
          success: false,
          msg: "Too many attempts, please try again later",
        };
      }
      return { success: false, msg: "Invalid email or password" };
    }

    return { success: true, user: toAuthUser(data.user) };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const unregisterPushToken = () => api.delete("/users/pushToken");

// Full teardown: stop pushes for this device, drop realtime channels, clear
// the badge, then end the Supabase session. Best-effort — always ends signed out.
export const logout = async () => {
  try {
    await unregisterPushToken(); // needs the session, so do it first
  } catch (error) {
    console.error("Error during logout cleanup:", error);
  }

  try {
    await supabase.removeAllChannels();
  } catch (error) {
    console.error("Error removing realtime channels:", error);
  }

  try {
    await clearNotificationBadge();
  } catch (error) {
    console.error("Error clearing notification badge:", error);
  }

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }

  // Legacy storage from the pre-Supabase-Auth builds.
  await AsyncStorage.multiRemove(["token", "user"]);
};

export const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
};

export const getStoredUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ? toAuthUser(data.session.user) : null;
};

// The server binds the push token to the authenticated user (from the JWT).
export const registerPushToken = async () => {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) {
      return;
    }

    const result = await api.post("/users/registerPushToken", { pushToken });
    if (!result.success) {
      console.error("Error registering push token:", result.msg);
    }
  } catch (error) {
    console.error("Error registering push token:", error);
  }
};
