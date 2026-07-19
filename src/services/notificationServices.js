import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";
import { unsubscribeFromChannel } from "./postService";

export const createNotification = async (notificationData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    });

    const result = await res.json();
    console.log("createNotificationViaAPI result:", result);
    return result;
  } catch (error) {
    console.error("Error creating notification via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchNotifications = async (receiverId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${receiverId}`);
    const result = await res.json();
    console.log("fetchNotificationsViaAPI result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching notifications via API:", error);
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
