import NotificationDeepLink from "@/components/NotificationDeepLink";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  isExpoGoAndroid,
  setNotificationHandler,
} from "@/services/notificationPermissions";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
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
  const theme = useTheme();
  const pathname = usePathname();

  // The window background sits behind everything React renders. It stayed at
  // its default light colour, which is what showed as a white band above the
  // keyboard once KeyboardAvoidingView shrank the content, and as a white
  // flash before the first screen painted.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch((error) => {
      console.error("Error setting system background:", error);
    });
  }, [theme]);
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

  // Push registration deliberately does NOT happen here any more. Doing it on
  // every sign-in fired the OS permission dialog with no context, and iOS only
  // ever shows that dialog once. PushPermissionPrompt on the feed explains
  // first, and registers silently when permission is already granted.

  return (
    <>
      {/*
        One StatusBar for the whole app. Rendered per-screen it was missing
        from every `(main)` screen, so those kept Android's default light icons
        — invisible against the light background.
      */}
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/*
        Declarative guards: authed screens simply do not exist while signed
        out (and vice versa), so a deep link can never render `(main)` with a
        null user. On sign-out the protected history is dropped and the router
        falls back to the anchor route, which redirects to /welcome.
      */}
      <Stack
        screenOptions={{
          headerShown: false,
          // Navigator screen container; without this every screen sits on a
          // white surface regardless of what the screen itself paints.
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
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
