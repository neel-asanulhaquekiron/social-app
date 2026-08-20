import {
  channelStatusLogger,
  supabase,
  unsubscribeFromChannel,
} from "@/lib/supabase";
import type { AppNotification, Paginated } from "@/types/api";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { api } from "./apiClient";

export const markNotificationAsClicked = (notificationId: number | string) =>
  api.patch<{ data: AppNotification }>(
    `/notifications/${notificationId}/clicked`,
  );

// Notifications for the authenticated user (derived from the token server-side).
export const fetchNotifications = ({
  limit = 20,
  cursor = null,
}: { limit?: number; cursor?: string | null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.append("cursor", cursor);

  return api.get<Paginated<AppNotification>>(
    `/notifications?${params.toString()}`,
  );
};

export const markNotificationsSeen = () =>
  api.post<{ updated: number }>("/notifications/mark-seen");

export const getUnseenNotificationCount = () =>
  api.get<{ count: number }>("/notifications/unseen-count");

export const subscribeToNotifications = (
  userId: string,
  onChange: (
    payload: RealtimePostgresChangesPayload<Record<string, any>>,
  ) => void,
): RealtimeChannel => {
  const existingChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === `realtime:notifications:${userId}`);

  if (existingChannel) {
    unsubscribeFromChannel(existingChannel);
  }

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `receiverId=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, any>>) =>
        onChange(payload),
    )
    .subscribe(channelStatusLogger(`notifications:${userId}`));
};
