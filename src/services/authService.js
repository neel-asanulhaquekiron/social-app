import { API_BASE_URL } from "@/constants";
import { registerForPushNotificationsAsync } from "@/services/notificationPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch } from "./apiClient";

export const signup = async ({ email, password, options }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, options }),
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

export const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

// Inside your login() and signup() functions, after successful auth:
export const registerPushToken = async (userId) => {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) {
      return;
    }

    const res = await authFetch(`${API_BASE_URL}/users/registerPushToken`, {
      method: "POST",
      body: JSON.stringify({ userId, pushToken }),
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
