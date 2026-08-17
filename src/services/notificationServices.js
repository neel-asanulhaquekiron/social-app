import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";
import { authFetch } from "./apiClient";
import { unsubscribeFromChannel } from "./postService";

export const createNotification = async ({ receiverId, title, data }) => {
  try {
    const res = await authFetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      body: JSON.stringify({ receiverId, title, data }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error creating notification via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const markNotificationAsClicked = async (notificationId) => {
  try {
    const res = await authFetch(
      `${API_BASE_URL}/notifications/${notificationId}/clicked`,
      { method: "PATCH" },
    );
    return await res.json();
  } catch (error) {
    console.error("Error marking notification as clicked via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

// Notifications for the authenticated user (derived from the token server-side).
export const fetchNotifications = async () => {
  try {
    const res = await authFetch(`${API_BASE_URL}/notifications`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching notifications via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const getUnseenNotificationCount = async () => {
  try {
    const res = await authFetch(`${API_BASE_URL}/notifications/unseen-count`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching unseen notification count via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const subscribeToNotifications = (userId, setNotificationCount) => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:notifications:${userId}`);
  if (existingChannel) {
    unsubscribeFromChannel(existingChannel);
  }

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `receiverId=eq.${userId}`,
      },
      async (payload) => {
        if (payload.eventType === "INSERT" && payload?.new?.id) {
          setNotificationCount((prevCount) => prevCount + 1);
        }
      },
    )
    .subscribe();

  return channel;
};
