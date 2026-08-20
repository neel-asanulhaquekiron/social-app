import {
  channelStatusLogger,
  supabase,
  unsubscribeFromChannel,
} from "@/lib/supabase";
import { api } from "./apiClient";

export const markNotificationAsClicked = (notificationId) =>
  api.patch(`/notifications/${notificationId}/clicked`);

// Notifications for the authenticated user (derived from the token server-side).
export const fetchNotifications = ({ limit = 20, cursor = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);

  return api.get(`/notifications?${params.toString()}`);
};

export const markNotificationsSeen = () => api.post("/notifications/mark-seen");

export const getUnseenNotificationCount = () =>
  api.get("/notifications/unseen-count");

export const subscribeToNotifications = (userId, onChange) => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:notifications:${userId}`);

  if (existingChannel) {
    unsubscribeFromChannel(existingChannel);
  }

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `receiverId=eq.${userId}`,
      },
      (payload) => onChange(payload),
    )
    .subscribe(channelStatusLogger(`notifications:${userId}`));
};
