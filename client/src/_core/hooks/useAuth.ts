import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [ready, setReady] = useState(false);
  const utils = trpc.useUtils();
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    enabled: ready,
  });

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      utils.auth.me.invalidate();
      refetch();
    });
    supabase.auth.getSession().finally(() => setReady(true));
    return () => sub.subscription.unsubscribe();
  }, [utils, refetch]);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    await utils.auth.me.invalidate();
  };

  return {
    user: user ?? null,
    loading: !ready || isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
