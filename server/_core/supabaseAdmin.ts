import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

export function getSupabaseAdmin() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceKey) return null;
  return createClient(ENV.supabaseUrl, ENV.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** E-mail interno usado no Supabase Auth (login é por username na UI) */
export function authEmailForUsername(username: string) {
  return `${username.toLowerCase().trim()}@app.conexoescreator.local`;
}
