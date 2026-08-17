import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  getStoredUser,
  getToken,
  registerPushToken,
} from "@/services/authService";
import {
  addNotificationResponseListener,
  setNotificationHandler,
} from "@/services/notificationPermissions";
import { getUserData } from "@/services/userService";
import { Stack, useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert, BackHandler } from "react-native";

// Must run at module load so foreground notifications are displayed
// (and the handler is set before any notification arrives).
setNotificationHandler();

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

const MainLayout = () => {
  const { setAuth, setUserData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const updateUserData = async (user) => {
    const res = await getUserData(user?.id);
    if (res.success) {
      setUserData(res.data);
    }
  };

  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const user = await getStoredUser();

      if (token && user) {
        setAuth(user);
        registerPushToken();
        router.replace("/home");
      } else {
        setAuth(null);
        router.replace("/welcome");
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    addNotificationResponseListener((data) => {
      if (data?.postId) {
        router.push({
          pathname: "postDetails",
          params: { postId: data.postId },
        });
      }
    }).then((fn) => {
      unsubscribe = fn;
    });

    return () => unsubscribe();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;
