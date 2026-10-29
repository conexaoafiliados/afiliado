import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  clearInstagramConnection,
  getCreatorProfile,
  getInstagramTokens,
  saveInstagramConnection,
  upsertSocialStats,
} from "../db";
import {
  exchangeInstagramCode,
  exchangeLongLivedToken,
  fetchInstagramStats,
  getInstagramAuthorizeUrl,
  isInstagramConfigured,
  parseInstagramState,
  resolveInstagramAccount,
} from "../_core/instagram";
import { protectedProcedure, router } from "../_core/trpc";

async function syncInstagramForUser(userId: number) {
  const tokens = await getInstagramTokens(userId);
  if (!tokens) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Conecte sua conta Instagram primeiro" });
  }

  const stats = await fetchInstagramStats(tokens.accessToken, tokens.igUserId);
  await upsertSocialStats(userId, "instagram", {
    followers: stats.followers,
    likes: stats.likes,
    views: stats.views,
    comments: stats.comments,
    mediaCount: stats.mediaCount,
  });

  await saveInstagramConnection(userId, {
    igUserId: tokens.igUserId,
    pageId: tokens.pageId ?? "",
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt ?? new Date(Date.now() + 60 * 24 * 3600 * 1000),
    displayName: stats.name,
    username: stats.username,
  });

  return {
    followers: stats.followers,
    likes: stats.likes,
    views: stats.views,
    comments: stats.comments,
    mediaCount: stats.mediaCount,
    displayName: stats.name,
    username: stats.username,
  };
}

export const instagramRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getCreatorProfile(ctx.user.id);
    const tokens = await getInstagramTokens(ctx.user.id);
    return {
      configured: isInstagramConfigured(),
      linked: Boolean(tokens?.accessToken),
      handle: profile?.instagramHandle ?? null,
      displayName: profile?.instagramDisplayName ?? null,
      linkedAt: profile?.instagramLinkedAt ?? null,
    };
  }),

  getConnectUrl: protectedProcedure.query(({ ctx }) => {
    if (!isInstagramConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Instagram/Meta não configurado (META_APP_ID e META_APP_SECRET). Crie um app em developers.facebook.com com Instagram Graph API.",
      });
    }
    return { url: getInstagramAuthorizeUrl(ctx.user.id) };
  }),

  completeConnect: protectedProcedure
    .input(z.object({ code: z.string().min(1), state: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!isInstagramConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Instagram/Meta não configurado" });
      }
      if (input.state) {
        const stateUserId = parseInstagramState(input.state);
        if (stateUserId !== null && stateUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sessão Instagram inválida" });
        }
      }

      const short = await exchangeInstagramCode(input.code);
      const longLived = await exchangeLongLivedToken(short.accessToken);
      const account = await resolveInstagramAccount(longLived.accessToken);

      await saveInstagramConnection(ctx.user.id, {
        igUserId: account.igUserId,
        pageId: account.pageId,
        accessToken: longLived.accessToken,
        expiresAt: new Date(Date.now() + longLived.expiresIn * 1000),
        displayName: account.name,
        username: account.username,
      });

      return syncInstagramForUser(ctx.user.id);
    }),

  syncNow: protectedProcedure.mutation(async ({ ctx }) => syncInstagramForUser(ctx.user.id)),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await clearInstagramConnection(ctx.user.id);
    return { success: true as const };
  }),
});
