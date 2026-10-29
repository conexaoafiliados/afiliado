import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  clearTikTokConnection,
  getCreatorProfile,
  getTikTokTokens,
  recordFollowerSnapshot,
  saveTikTokConnection,
  upsertSocialStats,
} from "../db";
import {
  exchangeTikTokCode,
  fetchTikTokUserStats,
  fetchTikTokVideoAggregates,
  getTikTokAuthorizeUrl,
  isTikTokConfigured,
  parseTikTokState,
  refreshTikTokToken,
} from "../_core/tiktok";
import { protectedProcedure, router } from "../_core/trpc";

async function syncFollowersForUser(userId: number) {
  const tokens = await getTikTokTokens(userId);
  if (!tokens) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte sua conta TikTok primeiro" });
  }

  let accessToken = tokens.accessToken;
  let refreshToken = tokens.refreshToken;
  let expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt) : null;
  if (expiresAt && expiresAt.getTime() < Date.now() + 60_000) {
    const refreshed = await refreshTikTokToken(tokens.refreshToken);
    accessToken = refreshed.access_token;
    refreshToken = refreshed.refresh_token;
    expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    await saveTikTokConnection(userId, {
      openId: refreshed.open_id,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt,
      displayName: tokens.displayName ?? undefined,
      username: tokens.username ?? undefined,
    });
  }

  const stats = await fetchTikTokUserStats(accessToken);
  const followers = stats.follower_count ?? 0;
  const videoAgg = await fetchTikTokVideoAggregates(accessToken);

  await recordFollowerSnapshot(userId, followers, "tiktok");
  await upsertSocialStats(userId, "tiktok", {
    followers,
    likes: videoAgg?.likes ?? stats.likes_count ?? 0,
    views: videoAgg?.views ?? 0,
    comments: videoAgg?.comments ?? 0,
    mediaCount: videoAgg?.mediaCount ?? stats.video_count ?? 0,
  });

  await saveTikTokConnection(userId, {
    openId: stats.open_id ?? tokens.openId ?? "",
    accessToken,
    refreshToken,
    expiresAt: expiresAt ?? new Date(Date.now() + 86400_000),
    displayName: stats.display_name,
    username: stats.username,
  });

  return {
    followers,
    likes: videoAgg?.likes ?? stats.likes_count ?? 0,
    views: videoAgg?.views ?? 0,
    comments: videoAgg?.comments ?? 0,
    displayName: stats.display_name,
    username: stats.username,
    followingCount: stats.following_count ?? 0,
    videoCount: stats.video_count ?? 0,
  };
}

export const tiktokRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getCreatorProfile(ctx.user.id);
    const tokens = await getTikTokTokens(ctx.user.id);
    return {
      configured: isTikTokConfigured(),
      linked: Boolean(tokens?.accessToken),
      handle: profile?.tiktokHandle ?? null,
      displayName: profile?.tiktokDisplayName ?? null,
      linkedAt: profile?.tiktokLinkedAt ?? null,
    };
  }),

  getConnectUrl: protectedProcedure.query(({ ctx }) => {
    if (!isTikTokConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "TikTok API não configurada (TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET)",
      });
    }
    return { url: getTikTokAuthorizeUrl(ctx.user.id) };
  }),

  completeConnect: protectedProcedure
    .input(z.object({ code: z.string().min(1), state: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!isTikTokConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "TikTok API não configurada" });
      }
      if (input.state) {
        const stateUserId = parseTikTokState(input.state);
        if (stateUserId !== null && stateUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sessão TikTok inválida" });
        }
      }

      const tokenData = await exchangeTikTokCode(input.code);
      await saveTikTokConnection(ctx.user.id, {
        openId: tokenData.open_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });

      return syncFollowersForUser(ctx.user.id);
    }),

  syncNow: protectedProcedure.mutation(async ({ ctx }) => syncFollowersForUser(ctx.user.id)),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await clearTikTokConnection(ctx.user.id);
    return { success: true as const };
  }),
});
