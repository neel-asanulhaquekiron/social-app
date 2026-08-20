import { useAuth } from "@/context/AuthContext";
import { queryKeys, unwrap } from "@/lib/queryClient";
import { getUnseenNotificationCount } from "@/services/notificationServices";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

/**
 * Unseen-notification badge count. Re-syncs whenever the screen regains focus
 * (e.g. returning from Notifications, where the server marked them seen).
 */
export const useUnseenCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.unseenCount,
    queryFn: async () => unwrap(await getUnseenNotificationCount()).count ?? 0,
    enabled: !!user?.id,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.unseenCount });
      }
    }, [user?.id, queryClient]),
  );

  return data ?? 0;
};
