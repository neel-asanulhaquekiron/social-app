import { supabase } from "@/lib/supabase";
import { toAuthUser } from "@/services/authService";
import type { AuthUser } from "@/types/api";
import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  setAuth: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Stays false until the persisted session has been read. Route guards must
  // wait for it, otherwise a signed-in user flashes the welcome screen on
  // every cold start.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Realtime must be carrying the user's JWT *before* any guarded screen
    // mounts and subscribes: postgres_changes on the authenticated-only
    // tables (notifications, comments, postLikes) silently deliver nothing to
    // a channel that was opened while the socket still had the anon key.
    // Passing the token explicitly keeps this off the auth lock.
    const applySession = async (session: Session | null | undefined) => {
      try {
        await supabase.realtime.setAuth(session?.access_token ?? null);
      } catch (error) {
        console.error("Error applying realtime auth:", error);
      }

      if (cancelled) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
      setIsReady(true);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data?.session))
      .catch((error) => {
        console.error("Error restoring session:", error);
        if (!cancelled) setIsReady(true);
      });

    // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED all land here, so a login, a
    // logout and a session revoked server-side move the guards the same way.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      applySession(session),
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, isReady, setAuth: setUser }),
    [user, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
