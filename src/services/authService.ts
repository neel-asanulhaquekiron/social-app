import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import {
  clearNotificationBadge,
  registerForPushNotificationsAsync,
} from "@/services/notificationPermissions";
import type { AuthUser } from "@/types/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";
import { api } from "./apiClient";

type AuthOutcome =
  { success: true; user: AuthUser } | { success: false; msg: string };

// Shape the app uses everywhere: { id, email, name }.
export const toAuthUser = (authUser: User): AuthUser => ({
  id: authUser.id,
  email: authUser.email,
  name: (authUser.user_metadata?.name as string | undefined) ?? null,
});

export const signup = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthOutcome> => {
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
    return {
      success: false,
      msg: (error as Error).message || "Something went wrong",
    };
  }
};

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthOutcome> => {
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
    return {
      success: false,
      msg: (error as Error).message || "Something went wrong",
    };
  }
};

export const unregisterPushToken = () =>
  api.delete<Record<string, never>>("/users/pushToken");

// Full teardown: stop pushes for this device, drop realtime channels, clear
// the badge, then end the Supabase session. Best-effort — always ends signed out.
export const logout = async (): Promise<void> => {
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

  // Never let the next account see the previous one's cached feed/notifications.
  queryClient.clear();

  // Legacy storage from the pre-Supabase-Auth builds.
  await AsyncStorage.multiRemove(["token", "user"]);
};

export const getToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
};

export const getStoredUser = async (): Promise<AuthUser | null> => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ? toAuthUser(data.session.user) : null;
};

/**
 * The server binds the push token to the authenticated user (from the JWT).
 *
 * Silent by default — it registers only if permission is already granted, so
 * launching the app never triggers the OS dialog. `promptIfNeeded` is passed
 * by the in-app explainer.
 */
export const registerPushToken = async ({
  promptIfNeeded = false,
}: { promptIfNeeded?: boolean } = {}): Promise<void> => {
  try {
    const pushToken = await registerForPushNotificationsAsync({
      promptIfNeeded,
    });
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
