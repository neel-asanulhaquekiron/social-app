import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  getStoredUser,
  getToken,
  registerPushToken,
} from "@/services/authService";
import { getUserData } from "@/services/userService";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Alert, BackHandler } from "react-native";

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

  const updateUserData = async (user) => {
    const res = await getUserData(user?.id);
    if (res.success) {
      setUserData(res.data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
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
    const checkAuth = async () => {
      const token = await getToken();
      const user = await getStoredUser();

      if (token && user) {
        setAuth(user);
        registerPushToken(user.id);
        router.replace("/home");
      } else {
        setAuth(null);
        router.replace("/welcome");
      }
    };

    checkAuth();
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;
