import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";
import {
  clearNotificationBadge,
  registerForPushNotificationsAsync,
} from "@/services/notificationPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch } from "./apiClient";

export const signup = async ({ email, password, name }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const result = await res.json();

    if (result.success) {
      await AsyncStorage.setItem("token", result.token);
      await AsyncStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const login = async ({ email, password }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();

    if (result.success) {
      await AsyncStorage.setItem("token", result.token);
      await AsyncStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const unregisterPushToken = async () => {
  try {
    const res = await authFetch(`${API_BASE_URL}/users/pushToken`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Error unregistering push token:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

// Full teardown: stop pushes for this device, drop realtime channels, clear
// the badge, then forget the session. Best-effort — always ends signed out.
export const logout = async () => {
  try {
    await unregisterPushToken(); // needs the token, so do it first
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

  await AsyncStorage.multiRemove(["token", "user"]);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

// Inside your login() and signup() functions, after successful auth:
// The server binds the token to the authenticated user (from the JWT).
export const registerPushToken = async () => {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) {
      return;
    }

    const res = await authFetch(`${API_BASE_URL}/users/registerPushToken`, {
      method: "POST",
      body: JSON.stringify({ pushToken }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `Error registering push token: HTTP ${res.status} ${text.slice(0, 200)}`,
      );
      return;
    }

    const result = await res.json();
    if (!result.success) {
      console.error("Error registering push token:", result.msg);
    }
  } catch (error) {
    console.error("Error registering push token:", error);
  }
};
