import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * Opens the post a tapped notification points at.
 *
 * `useLastNotificationResponse` covers cold start, background and foreground
 * taps in one place, and holds the response until it is handled — so we can
 * wait for auth to resolve instead of racing it, which is what used to send
 * cold-start taps to /home. Renders nothing.
 *
 * Only mounted outside Expo Go on Android (see `isExpoGoAndroid`), so the hook
 * order stays stable — and so this require() is safe. expo-notifications
 * throws on import in Expo Go on Android, so it must not be imported at
 * module scope: doing that crashed the whole app there.
 */
const NotificationDeepLink = () => {
  const Notifications = require("expo-notifications");

  const router = useRouter();
  const { user, isReady } = useAuth();
  const response = Notifications.useLastNotificationResponse();
  const handledRef = useRef(null);

  useEffect(() => {
    // `undefined` while initialising, `null` when there is nothing to handle.
    if (!isReady || !user || !response) {
      return;
    }

    // Ignore custom notification actions — only a plain tap opens the post.
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    const requestId = response.notification?.request?.identifier ?? null;
    if (requestId && handledRef.current === requestId) {
      return;
    }

    const data = response.notification?.request?.content?.data ?? {};
    if (!data.postId) {
      return;
    }

    handledRef.current = requestId;

    // Clear it so the same tap is not replayed after a remount.
    Notifications.clearLastNotificationResponseAsync?.().catch(() => {});

    router.push({
      pathname: "/postDetails",
      params: {
        postId: String(data.postId),
        ...(data.commentId ? { commentId: String(data.commentId) } : {}),
      },
    });
  }, [isReady, user, response, router, Notifications]);

  return null;
};

export default NotificationDeepLink;
