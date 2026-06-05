import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() ?? "";

const PLACEHOLDER_MARKERS = ["SEU_PROJETO", "sua_anon_key", "sua_service_role", "example.com"];

export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    const isProd = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
    return isProd
      ? "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas na Vercel. Vá em Settings → Environment Variables, adicione-as e faça Redeploy."
      : "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie npm run dev.";
  }
  if (PLACEHOLDER_MARKERS.some(m => supabaseUrl.includes(m) || supabaseAnonKey.includes(m))) {
    return "O .env ainda tem valores de exemplo. Copie a URL e a chave anon reais em Supabase → Settings → API.";
  }
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    return "VITE_SUPABASE_URL deve ser algo como https://abcdefgh.supabase.co";
  }
  if (!supabaseAnonKey.startsWith("eyJ")) {
    return "VITE_SUPABASE_ANON_KEY parece inválida. Use a chave anon public (começa com eyJ).";
  }
  return null;
}

export const supabase = getSupabaseConfigError()
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function getLoginUrl() {
  return "/login";
}
