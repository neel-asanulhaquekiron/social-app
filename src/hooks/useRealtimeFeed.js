import { useAuth } from "@/context/AuthContext";
import { patchCommentCount, updateCachedPost } from "@/lib/postCache";
import { queryKeys } from "@/lib/queryClient";
import { unsubscribeFromChannel } from "@/lib/supabase";
import { subscribeToNotifications } from "@/services/notificationServices";
import {
  subscribeToAllComments,
  subscribeToPosts,
} from "@/services/postService";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Keeps the feed and the notification badge live.
 *
 * The rule throughout: patch the cache when an event can't change which rows
 * belong in the list, invalidate when it can. Invalidating an infinite query
 * refetches every page the user has scrolled through, so it's reserved for
 * membership changes.
 */
export const useRealtimeFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return undefined;

    const postChannel = subscribeToPosts((payload) => {
      // An edited body can't move a row; the payload carries raw columns
      // only, so spread it over the cached post to keep the joined user and
      // the counts.
      if (payload.eventType === "UPDATE" && payload.new?.id) {
        updateCachedPost(queryClient, payload.new.id, (post) => ({
          ...post,
          ...payload.new,
        }));
        return;
      }

      // INSERT/DELETE change membership — and under an active username filter
      // only the server can say whether a new post qualifies.
      queryClient.invalidateQueries({ queryKey: queryKeys.allPosts });
    });

    const commentChannel = subscribeToAllComments((payload) => {
      const postId = payload?.new?.postId ?? payload?.old?.postId;
      const delta =
        payload.eventType === "INSERT"
          ? 1
          : payload.eventType === "DELETE"
            ? -1
            : 0;

      if (postId && delta !== 0) {
        patchCommentCount(queryClient, postId, delta);
      }
    });

    const notificationChannel = subscribeToNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unseenCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    });

    return () => {
      unsubscribeFromChannel(postChannel);
      unsubscribeFromChannel(commentChannel);
      unsubscribeFromChannel(notificationChannel);
    };
  }, [user?.id, queryClient]);
};
