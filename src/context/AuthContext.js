import { supabase } from "@/lib/supabase";
import { toAuthUser } from "@/services/authService";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Stays false until the persisted session has been read. Route guards must
  // wait for it, otherwise a signed-in user flashes the welcome screen on
  // every cold start.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data?.session?.user ? toAuthUser(data.session.user) : null);
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Error restoring session:", error);
        if (!cancelled) setIsReady(true);
      });

    // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED all land here, so a login, a
    // logout and a session revoked server-side move the guards the same way.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      setAuth: setUser,
      setUserData: (userData) =>
        setUser((prevUser) => ({ ...prevUser, ...userData })),
    }),
    [user, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
