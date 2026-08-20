import { channelStatusLogger, supabase } from "@/lib/supabase";
import { api } from "./apiClient";
import { unsubscribeFromChannel } from "./postService";

export const markNotificationAsClicked = (notificationId) =>
  api.patch(`/notifications/${notificationId}/clicked`);

// Notifications for the authenticated user (derived from the token server-side).
export const fetchNotifications = () => api.get("/notifications");

export const markNotificationsSeen = () => api.post("/notifications/mark-seen");

export const getUnseenNotificationCount = () =>
  api.get("/notifications/unseen-count");

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
    .subscribe(channelStatusLogger(`notifications:${userId}`));

  return channel;
};
