/** Converte URL direct (db.*.supabase.co) para pooler IPv4 da Vercel. */
export function resolveDatabaseUrl(raw: string): string {
  if (!raw) return "";

  const override = process.env.DATABASE_POOLER_URL?.trim();
  if (override) return override;

  if (raw.includes("pooler.supabase.com")) return raw;

  try {
    const normalized = raw.replace(/^postgres:\/\//, "postgresql://");
    const url = new URL(normalized);

    let projectRef = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
    if (!projectRef) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
      projectRef = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
    }
    if (!projectRef) return raw;

    const region = process.env.SUPABASE_POOLER_REGION?.trim() || "us-east-1";
    const user = url.username === "postgres" ? `postgres.${projectRef}` : url.username;

    url.protocol = "postgresql:";
    url.username = user;
    // Supabase usa aws-0-REGION ou aws-REGION conforme o projeto
    const poolerHost = process.env.SUPABASE_POOLER_HOST?.trim()
      || `aws-0-${region}.pooler.supabase.com`;
    url.hostname = poolerHost;
    url.port = "6543";
    if (!url.pathname || url.pathname === "/") url.pathname = "/postgres";

    return url.toString();
  } catch {
    return raw;
  }
}

export const ENV = {
  databaseUrl: resolveDatabaseUrl(process.env.DATABASE_URL ?? ""),
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: (process.env.APP_URL ?? process.env.VITE_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? "",
};
