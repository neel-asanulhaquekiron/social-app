import { AuthProvider, useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
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
  const { setAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      console.log("session user", session?.user?.id);
      if (session) {
        setAuth(session.user);
        router.push("/home");
      } else {
        setAuth(null);
        router.push("/welcome");
      }
    });
  }, []);
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default _layout;
