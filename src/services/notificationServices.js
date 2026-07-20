import { API_BASE_URL } from "@/constants";
import { supabase } from "@/lib/supabase";
import { unsubscribeFromChannel } from "./postService";

export const createNotification = async (notificationData) => {
  try {
    const updatedNotificationData = {
      ...notificationData,
      isSeen: false,
      isClicked: false,
    };
    const res = await fetch(`${API_BASE_URL}/notifications/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedNotificationData),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error creating notification via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const markNotificationAsClicked = async (notificationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isClicked: true }),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error marking notification as clicked via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const fetchNotifications = async (receiverId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${receiverId}`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error fetching notifications via API:", error);
    return { success: false, msg: error.message || "Something went wrong" };
  }
};

export const getUnseenNotificationCount = async (receiverId) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/notifications/unseen-count/${receiverId}`,
    );
    const result = await res.json();
    return result;
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
