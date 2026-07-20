import { AuthProvider, useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { getUserData } from "../../services/userService";

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

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user);
        updateUserData(session.user);
        router.replace("/home");
      } else {
        setAuth(null);
        router.push("/welcome");
      }
    });
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;
