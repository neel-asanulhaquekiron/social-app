import { AuthProvider, useAuth } from "@/context/AuthContext";
import { getStoredUser, getToken } from "@/services/authService";
import { getUserData } from "@/services/userService";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

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

  // useEffect(() => {
  //   supabase.auth.onAuthStateChange((_event, session) => {
  //     if (session) {
  //       setAuth(session.user);
  //       updateUserData(session.user);
  //       router.push("/home");
  //     } else {
  //       setAuth(null);
  //       router.push("/welcome");
  //     }
  //   });
  // }, []);
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      const user = await getStoredUser();

      if (token && user) {
        setAuth(user);
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
