import NotificationDeepLink from "@/components/NotificationDeepLink";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { registerPushToken } from "@/services/authService";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  isExpoGoAndroid,
  setNotificationHandler,
} from "@/services/notificationPermissions";
import { Stack, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, BackHandler } from "react-native";

// Must run at module load so foreground notifications are displayed
// (and the handler is set before any notification arrives).
setNotificationHandler();

const _layout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
};

const MainLayout = () => {
  const { user, isReady } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Root-level hardware back handling: a plain effect, since the root layout
  // is never blurred (useFocusEffect would re-subscribe on every navigation).
  useEffect(() => {
    const onBackPress = () => {
      if (pathnameRef.current !== "/home") {
        return false;
      }

      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, []);

  // Bind this device's push token to whoever is signed in (login, signup and
  // restored sessions all pass through here).
  useEffect(() => {
    if (user?.id) {
      registerPushToken();
    }
  }, [user?.id]);

  return (
    <>
      {/*
        Declarative guards: authed screens simply do not exist while signed
        out (and vice versa), so a deep link can never render `(main)` with a
        null user. On sign-out the protected history is dropped and the router
        falls back to the anchor route, which redirects to /welcome.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isReady && !!user}>
          <Stack.Screen name="(main)" />
        </Stack.Protected>

        <Stack.Protected guard={isReady && !user}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack.Protected>
      </Stack>

      {!isExpoGoAndroid && <NotificationDeepLink />}
    </>
  );
};

export default _layout;
