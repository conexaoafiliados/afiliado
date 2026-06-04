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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const utils = trpc.useUtils();

  const { data: appUser, isLoading: appUserLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    enabled: authReady && !!session,
    retry: 2,
  });

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    const applySession = (next: Session | null) => {
      if (!mounted) return;
      setSession(next);
      if (next) {
        cleanAuthHashFromUrl();
        void utils.auth.me.invalidate();
        void refetch();
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [utils, refetch]);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    await utils.auth.me.invalidate();
  };

  const displayUser = appUser ?? (session?.user
    ? {
        id: 0,
        openId: session.user.id,
        name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "Creator",
        email: session.user.email ?? null,
        loginMethod: "supabase",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null);

  const isAuthenticated = !!session;
  const loading = !authReady || (isAuthenticated && appUserLoading && !appUser);

  return {
    user: displayUser,
    session,
    loading,
    isAuthenticated,
    logout,
  };
}
