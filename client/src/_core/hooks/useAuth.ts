import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

function cleanAuthHashFromUrl() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (hash && (hash.includes("access_token") || hash.includes("type=magiclink"))) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

function sessionFallbackUser(session: Session) {
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  return {
    id: 0,
    openId: session.user.id,
    name:
      (typeof meta?.name === "string" && meta.name) ||
      (typeof meta?.full_name === "string" && meta.full_name) ||
      session.user.email?.split("@")[0] ||
      "Creator",
    email: session.user.email ?? null,
    loginMethod: "supabase",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const utils = trpc.useUtils();

  const { data: appUser } = trpc.auth.me.useQuery(undefined, {
    enabled: authReady && !!session,
    retry: false,
    refetchOnWindowFocus: false,
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthReady(true);
      if (nextSession) {
        cleanAuthHashFromUrl();
        void utils.auth.me.invalidate();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [utils]);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    await utils.auth.me.invalidate();
  };

  const displayUser = appUser ?? (session ? sessionFallbackUser(session) : null);
  const isAuthenticated = !!session;
  const loading = !authReady;

  return {
    user: displayUser,
    session,
    loading,
    isAuthenticated,
    logout,
  };
}
