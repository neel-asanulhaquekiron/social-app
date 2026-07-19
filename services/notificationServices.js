import { supabase } from "@/lib/supabase";
import { unsubscribeFromChannel } from "./postService";

export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

export const fetchNotifications = async (receiverId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, sender: senderId (id, name)")
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error };
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
