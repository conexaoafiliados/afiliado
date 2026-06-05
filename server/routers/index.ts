import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getCreatorProfile,
  getFollowerProgress,
  recordFollowerSnapshot,
  searchUsersByUsername,
  updateUserById,
  upsertCreatorProfile,
  upsertFollowerProgress,
} from "../db";
import { resolveFollowerGoal } from "../_core/goals";
import { uploadImage } from "../_core/storage";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { missionsRouter } from "./missions";
import { coursesRouter } from "./courses";
import { shopRouter } from "./shop";
import { communityRouter } from "./community";
import { paymentsRouter } from "./payments";
import { ordersRouter } from "./orders";
import { achievementsRouter } from "./achievements";
import { authRouter } from "./auth";
import { analyticsRouter } from "./analytics";
import { tiktokRouter } from "./tiktok";
import { notificationsRouter } from "./notifications";

export const appRouter = router({
  system: systemRouter,

  auth: authRouter,

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => (await getCreatorProfile(ctx.user.id)) || null),

    update: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120).optional(),
          bio: z.string().max(500).optional(),
          profileImageUrl: z.string().url().optional(),
          bannerImageUrl: z.string().url().optional(),
          profileImageBase64: z.string().optional(),
          profileImageMime: z.string().optional(),
          bannerImageBase64: z.string().optional(),
          bannerImageMime: z.string().optional(),
          instagramHandle: z.string().max(100).optional(),
          tiktokHandle: z.string().max(100).optional(),
          youtubeHandle: z.string().max(100).optional(),
          twitterHandle: z.string().max(100).optional(),
          websiteUrl: z.string().url().optional().or(z.literal("")),
          age: z.number().int().min(13).max(120).optional(),
          platformObjective: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const {
          name,
          profileImageBase64,
          profileImageMime,
          bannerImageBase64,
          bannerImageMime,
          websiteUrl,
          ...profileFields
        } = input;

        if (name) await updateUserById(ctx.user.id, { name });

        const profileUpdate: Record<string, unknown> = { ...profileFields };
        if (websiteUrl === "") profileUpdate.websiteUrl = null;
        else if (websiteUrl) profileUpdate.websiteUrl = websiteUrl;

        if (profileImageBase64) {
          const url = await uploadImage("avatars", `profile-${ctx.user.id}`, profileImageBase64, profileImageMime);
          if (url) profileUpdate.profileImageUrl = url;
        }
        if (bannerImageBase64) {
          const url = await uploadImage("avatars", `banner-${ctx.user.id}`, bannerImageBase64, bannerImageMime);
          if (url) profileUpdate.bannerImageUrl = url;
        }

        await upsertCreatorProfile(ctx.user.id, profileUpdate);
        return getCreatorProfile(ctx.user.id);
      }),

    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getCreatorProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        return profile;
      }),
  }),

  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getFollowerProgress(ctx.user.id);
      return (
        progress || {
          userId: ctx.user.id,
          currentFollowers: 0,
          targetFollowers: 2000,
          progressPercentage: "0",
        }
      );
    }),

    update: protectedProcedure
      .input(
        z.object({
          currentFollowers: z.number().min(0).optional(),
          targetFollowers: z.number().min(1).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getFollowerProgress(ctx.user.id);
        const current = input.currentFollowers ?? existing?.currentFollowers ?? 0;
        if (input.currentFollowers !== undefined) {
          await recordFollowerSnapshot(ctx.user.id, current, "manual");
        } else if (input.targetFollowers !== undefined) {
          const { targetFollowers, progressPercentage } = resolveFollowerGoal(
            input.targetFollowers,
            current
          );
          await upsertFollowerProgress(ctx.user.id, {
            targetFollowers,
            progressPercentage: progressPercentage.toFixed(2),
            lastUpdated: new Date(),
          });
        }
        return getFollowerProgress(ctx.user.id);
      }),
  }),

  missions: missionsRouter,
  achievements: achievementsRouter,
  courses: coursesRouter,
  shop: shopRouter,
  community: communityRouter,
  payments: paymentsRouter,
  orders: ordersRouter,
  tiktok: tiktokRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,

  users: router({
    search: protectedProcedure
      .input(z.object({ q: z.string().min(1).max(30) }))
      .query(async ({ input }) => searchUsersByUsername(input.q)),
  }),
});

export type AppRouter = typeof appRouter;
