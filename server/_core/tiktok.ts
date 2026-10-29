import { createHmac, randomBytes } from "crypto";
import { ENV } from "./env";

const TIKTOK_AUTH = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_INFO = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_VIDEO_LIST = "https://open.tiktokapis.com/v2/video/list/";
/** video.list é opcional: se aprovado, somamos views/comentários dos vídeos. */
const SCOPES = "user.info.basic,user.info.profile,user.info.stats,video.list";

export function isTikTokConfigured() {
  return Boolean(ENV.tiktokClientKey && ENV.tiktokClientSecret);
}

export function getTikTokRedirectUri() {
  return `${ENV.appUrl}/growth/progress`;
}

export function buildTikTokState(userId: number) {
  const nonce = randomBytes(8).toString("hex");
  const payload = `${userId}.${nonce}`;
  const secret = ENV.tiktokClientSecret || ENV.supabaseServiceKey || "cc-tiktok-state";
  const sig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

export function parseTikTokState(state: string): number | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const userId = parseInt(parts[0], 10);
  if (!Number.isFinite(userId)) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const secret = ENV.tiktokClientSecret || ENV.supabaseServiceKey || "cc-tiktok-state";
  const expected = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  if (parts[2] !== expected) return null;
  return userId;
}

export function getTikTokAuthorizeUrl(userId: number) {
  const params = new URLSearchParams({
    client_key: ENV.tiktokClientKey,
    scope: SCOPES,
    response_type: "code",
    redirect_uri: getTikTokRedirectUri(),
    state: buildTikTokState(userId),
  });
  return `${TIKTOK_AUTH}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope?: string;
};

async function postToken(body: Record<string, string>) {
  const res = await fetch(TIKTOK_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json()) as { data?: TokenResponse; error?: { message?: string } };
  if (!res.ok || !json.data?.access_token) {
    throw new Error(json.error?.message ?? "Falha ao obter token do TikTok");
  }
  return json.data;
}

export async function exchangeTikTokCode(code: string) {
  return postToken({
    client_key: ENV.tiktokClientKey,
    client_secret: ENV.tiktokClientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: getTikTokRedirectUri(),
  });
}

export async function refreshTikTokToken(refreshToken: string) {
  return postToken({
    client_key: ENV.tiktokClientKey,
    client_secret: ENV.tiktokClientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function fetchTikTokUserStats(accessToken: string) {
  const fields =
    "open_id,display_name,username,follower_count,following_count,likes_count,video_count";
  const res = await fetch(`${TIKTOK_USER_INFO}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as {
    data?: {
      user?: {
        open_id?: string;
        display_name?: string;
        username?: string;
        follower_count?: number;
        following_count?: number;
        likes_count?: number;
        video_count?: number;
      };
    };
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.user) {
    throw new Error(json.error?.message ?? "Não foi possível ler dados do TikTok");
  }
  return json.data.user;
}

/** Soma views/comentários/curtidas dos vídeos recentes (requer scope video.list). */
export async function fetchTikTokVideoAggregates(accessToken: string): Promise<{
  views: number;
  comments: number;
  likes: number;
  mediaCount: number;
} | null> {
  try {
    const res = await fetch(`${TIKTOK_VIDEO_LIST}?fields=id,view_count,comment_count,like_count`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20 }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        videos?: Array<{ view_count?: number; comment_count?: number; like_count?: number }>;
      };
    };
    const videos = json.data?.videos ?? [];
    if (!videos.length) return { views: 0, comments: 0, likes: 0, mediaCount: 0 };
    return {
      views: videos.reduce((s, v) => s + (v.view_count ?? 0), 0),
      comments: videos.reduce((s, v) => s + (v.comment_count ?? 0), 0),
      likes: videos.reduce((s, v) => s + (v.like_count ?? 0), 0),
      mediaCount: videos.length,
    };
  } catch {
    return null;
  }
}
