import { supabase } from "@/lib/supabase";

export async function applyAuthSession(accessToken: string, refreshToken: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
}
