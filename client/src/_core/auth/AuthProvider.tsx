import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { User } from "../../../../drizzle/schema";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasDbUser: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function cleanAuthHashFromUrl() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (hash && (hash.includes("access_token") || hash.includes("type=magiclink"))) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

function buildFallbackUser(session: Session): User {
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  const now = new Date();
  return {
    id: 0,
    openId: session.user.id,
    username: null,
    name:
      (typeof meta?.name === "string" && meta.name) ||
      (typeof meta?.full_name === "string" && meta.full_name) ||
      session.user.email?.split("@")[0] ||
      "Creator",
    email: session.user.email ?? null,
    loginMethod: "supabase",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const utils = trpc.useUtils();

  const { data: appUser } = trpc.auth.me.useQuery(undefined, {
    enabled: authReady && !!session,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) cleanAuthHashFromUrl();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthReady(true);
      if (nextSession) cleanAuthHashFromUrl();
      if (event === "SIGNED_IN") {
        void utils.auth.me.invalidate();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    await utils.auth.me.invalidate();
  }, [utils]);

  const user = useMemo(
    () => appUser ?? (session ? buildFallbackUser(session) : null),
    [appUser, session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading: !authReady,
      isAuthenticated: !!session,
      hasDbUser: !!appUser?.id,
      logout,
    }),
    [user, session, authReady, appUser?.id, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
