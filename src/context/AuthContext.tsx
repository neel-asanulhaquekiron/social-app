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

    // Deliberately synchronous, and deliberately does NOT touch
    // supabase.realtime.setAuth().
    //
    // This runs inside onAuthStateChange, which supabase-js dispatches while
    // holding the auth lock. realtime.setAuth(null) treats a null token as
    // "go and fetch one" and calls the accessToken callback -> auth.getSession()
    // -> which waits on that same lock. The await never resolved, so on sign-out
    // setUser(null) never ran and the app stayed on the authed screens: logout
    // looked like it did nothing.
    //
    // The setAuth call was only ever defensive (see #32, where the race it
    // guarded against did not reproduce). supabase-js already pushes the token
    // to realtime on SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION, so nothing
    // is lost by removing it.
    const applySession = (session: Session | null | undefined) => {
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
