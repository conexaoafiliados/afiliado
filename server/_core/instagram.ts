import { createHmac, randomBytes } from "crypto";
import { ENV } from "./env";

const FB_AUTH = "https://www.facebook.com/v21.0/dialog/oauth";
const FB_TOKEN = "https://graph.facebook.com/v21.0/oauth/access_token";
const FB_GRAPH = "https://graph.facebook.com/v21.0";

/** Escopos mínimos para ler perfil IG Business/Creator ligado a uma Página. */
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
].join(",");

export function isInstagramConfigured() {
  return Boolean(ENV.metaAppId && ENV.metaAppSecret);
}

export function getInstagramRedirectUri() {
  return `${ENV.appUrl}/growth/progress`;
}

export function buildInstagramState(userId: number) {
  const nonce = randomBytes(8).toString("hex");
  const payload = `ig.${userId}.${nonce}`;
  const secret = ENV.metaAppSecret || ENV.supabaseServiceKey || "cc-ig-state";
  const sig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

export function parseInstagramState(state: string): number | null {
  const parts = state.split(".");
  // ig.{userId}.{nonce}.{sig}
  if (parts.length !== 4 || parts[0] !== "ig") return null;
  const userId = parseInt(parts[1], 10);
  if (!Number.isFinite(userId)) return null;
  const payload = `ig.${parts[1]}.${parts[2]}`;
  const secret = ENV.metaAppSecret || ENV.supabaseServiceKey || "cc-ig-state";
  const expected = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  if (parts[3] !== expected) return null;
  return userId;
}

/** Detecta callback Instagram vs TikTok pelo state. */
export function isInstagramOAuthState(state: string | null | undefined): boolean {
  return Boolean(state && state.startsWith("ig."));
}

export function getInstagramAuthorizeUrl(userId: number) {
  const params = new URLSearchParams({
    client_id: ENV.metaAppId,
    redirect_uri: getInstagramRedirectUri(),
    state: buildInstagramState(userId),
    scope: SCOPES,
    response_type: "code",
  });
  return `${FB_AUTH}?${params.toString()}`;
}

export async function exchangeInstagramCode(code: string) {
  const params = new URLSearchParams({
    client_id: ENV.metaAppId,
    client_secret: ENV.metaAppSecret,
    redirect_uri: getInstagramRedirectUri(),
    code,
  });
  const res = await fetch(`${FB_TOKEN}?${params.toString()}`);
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message ?? "Falha ao obter token do Instagram/Meta");
  }
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in ?? 60 * 24 * 3600,
  };
}

/** Troca por token de longa duração (~60 dias). */
export async function exchangeLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: ENV.metaAppId,
    client_secret: ENV.metaAppSecret,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(`${FB_TOKEN}?${params.toString()}`);
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    // Mantém o token curto se a troca falhar
    return { accessToken: shortLivedToken, expiresIn: 3600 };
  }
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in ?? 60 * 24 * 3600,
  };
}

type IgAccount = {
  igUserId: string;
  pageId: string;
  username: string | null;
  name: string | null;
};

/** Encontra a primeira conta Instagram Business/Creator nas Páginas do usuário. */
export async function resolveInstagramAccount(accessToken: string): Promise<IgAccount> {
  const pagesRes = await fetch(
    `${FB_GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&limit=25&access_token=${encodeURIComponent(accessToken)}`
  );
  const pagesJson = (await pagesRes.json()) as {
    data?: Array<{
      id: string;
      name?: string;
      instagram_business_account?: { id: string; username?: string; name?: string };
    }>;
    error?: { message?: string };
  };
  if (!pagesRes.ok) {
    throw new Error(pagesJson.error?.message ?? "Não foi possível listar Páginas do Facebook");
  }

  const withIg = (pagesJson.data ?? []).find(p => p.instagram_business_account?.id);
  if (!withIg?.instagram_business_account?.id) {
    throw new Error(
      "Nenhuma conta Instagram Business/Creator ligada a uma Página do Facebook foi encontrada. Converta o Instagram para profissional e vincule a uma Página."
    );
  }

  return {
    igUserId: withIg.instagram_business_account.id,
    pageId: withIg.id,
    username: withIg.instagram_business_account.username ?? null,
    name: withIg.instagram_business_account.name ?? withIg.name ?? null,
  };
}

export type InstagramStats = {
  followers: number;
  mediaCount: number;
  likes: number;
  comments: number;
  views: number;
  username: string | null;
  name: string | null;
};

export async function fetchInstagramStats(accessToken: string, igUserId: string): Promise<InstagramStats> {
  const profileRes = await fetch(
    `${FB_GRAPH}/${igUserId}?fields=followers_count,media_count,username,name&access_token=${encodeURIComponent(accessToken)}`
  );
  const profile = (await profileRes.json()) as {
    followers_count?: number;
    media_count?: number;
    username?: string;
    name?: string;
    error?: { message?: string };
  };
  if (!profileRes.ok) {
    throw new Error(profile.error?.message ?? "Não foi possível ler o perfil Instagram");
  }

  let likes = 0;
  let comments = 0;
  let views = 0;

  // Soma curtidas/comentários dos posts recentes (até ~50). Views/impressões via insights quando disponível.
  try {
    const mediaRes = await fetch(
      `${FB_GRAPH}/${igUserId}/media?fields=id,like_count,comments_count,media_type,timestamp&limit=50&access_token=${encodeURIComponent(accessToken)}`
    );
    const mediaJson = (await mediaRes.json()) as {
      data?: Array<{ id: string; like_count?: number; comments_count?: number; media_type?: string }>;
    };
    for (const m of mediaJson.data ?? []) {
      likes += m.like_count ?? 0;
      comments += m.comments_count ?? 0;
    }

    // Insights de impressões/alcance (melhor esforço; falha silenciosa se escopo ausente)
    const sample = (mediaJson.data ?? []).slice(0, 12);
    for (const m of sample) {
      try {
        const metric =
          m.media_type === "VIDEO" || m.media_type === "REELS" ? "plays,reach" : "impressions,reach";
        const insightRes = await fetch(
          `${FB_GRAPH}/${m.id}/insights?metric=${metric}&access_token=${encodeURIComponent(accessToken)}`
        );
        if (!insightRes.ok) continue;
        const insightJson = (await insightRes.json()) as {
          data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
        };
        for (const row of insightJson.data ?? []) {
          const value = row.values?.[0]?.value ?? 0;
          if (row.name === "plays" || row.name === "impressions" || row.name === "reach") {
            views += value;
          }
        }
      } catch {
        // ignore per-media insight errors
      }
    }
  } catch {
    // perfil ok; métricas de mídia opcionais
  }

  return {
    followers: profile.followers_count ?? 0,
    mediaCount: profile.media_count ?? 0,
    likes,
    comments,
    views,
    username: profile.username ?? null,
    name: profile.name ?? null,
  };
}
