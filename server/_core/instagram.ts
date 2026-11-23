import { createHmac, randomBytes } from "crypto";
import { ENV } from "./env";

const IG_AUTH = "https://www.instagram.com/oauth/authorize";
const IG_TOKEN = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH = "https://graph.instagram.com/v21.0";

/**
 * Login direto no Instagram (conta profissional).
 * Não usa Facebook Login: pages_* e business_management são recusados nesse diálogo
 * e geram "Invalid Scopes".
 */
const SCOPES = "instagram_business_basic";

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
    enable_fb_login: "0",
  });
  return `${IG_AUTH}?${params.toString()}`;
}

function igErrorMessage(json: { error_message?: string; error?: { message?: string } }, fallback: string) {
  return json.error_message || json.error?.message || fallback;
}

export async function exchangeInstagramCode(code: string) {
  const body = new URLSearchParams({
    client_id: ENV.metaAppId,
    client_secret: ENV.metaAppSecret,
    grant_type: "authorization_code",
    redirect_uri: getInstagramRedirectUri(),
    code: code.replace(/#_$/, ""),
  });
  const res = await fetch(IG_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    user_id?: string | number;
    data?: Array<{ access_token?: string; user_id?: string | number }>;
    error_message?: string;
    error?: { message?: string };
  };
  const payload = json.data?.[0] ?? json;
  if (!res.ok || !payload.access_token) {
    throw new Error(igErrorMessage(json, "Falha ao obter token do Instagram"));
  }
  return {
    accessToken: payload.access_token,
    userId: payload.user_id != null ? String(payload.user_id) : null,
    expiresIn: 3600,
  };
}

/** Troca por token de longa duração (~60 dias). */
export async function exchangeLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: ENV.metaAppSecret,
    access_token: shortLivedToken,
  });
  const res = await fetch(`${IG_GRAPH}/access_token?${params.toString()}`);
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error_message?: string;
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

/** Lê a conta profissional que acabou de autorizar o app. Não exige Página do Facebook. */
export async function resolveInstagramAccount(accessToken: string, fallbackUserId?: string | null): Promise<IgAccount> {
  const profileRes = await fetch(
    `${IG_GRAPH}/me?fields=user_id,username,name,account_type&access_token=${encodeURIComponent(accessToken)}`
  );
  const profile = (await profileRes.json()) as {
    user_id?: string | number;
    id?: string;
    username?: string;
    name?: string;
    account_type?: string;
    error?: { message?: string };
    error_message?: string;
  };
  if (!profileRes.ok) {
    throw new Error(igErrorMessage(profile, "Não foi possível ler o perfil do Instagram"));
  }

  const igUserId = String(profile.user_id ?? profile.id ?? fallbackUserId ?? "");
  if (!igUserId) {
    throw new Error("O Instagram não devolveu o identificador da conta.");
  }
  if (profile.account_type === "PERSONAL") {
    throw new Error("A conta precisa ser profissional (Business ou Creator) para conectar.");
  }

  return {
    igUserId,
    pageId: "instagram-login",
    username: profile.username ?? null,
    name: profile.name ?? null,
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
    `${IG_GRAPH}/${igUserId}?fields=followers_count,media_count,username,name&access_token=${encodeURIComponent(accessToken)}`
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
      `${IG_GRAPH}/${igUserId}/media?fields=id,like_count,comments_count,media_type&limit=50&access_token=${encodeURIComponent(accessToken)}`
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
          `${IG_GRAPH}/${m.id}/insights?metric=${metric}&access_token=${encodeURIComponent(accessToken)}`
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
