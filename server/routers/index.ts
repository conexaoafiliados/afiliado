import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCreatorProfile, getFollowerProgress, upsertCreatorProfile, upsertFollowerProgress } from "../db";
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

export const appRouter = router({
  system: systemRouter,

  auth: authRouter,

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => (await getCreatorProfile(ctx.user.id)) || null),

    update: protectedProcedure
      .input(
        z.object({
          bio: z.string().max(500).optional(),
          profileImageUrl: z.string().url().optional(),
          bannerImageUrl: z.string().url().optional(),
          instagramHandle: z.string().max(100).optional(),
          tiktokHandle: z.string().max(100).optional(),
          youtubeHandle: z.string().max(100).optional(),
          twitterHandle: z.string().max(100).optional(),
          websiteUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertCreatorProfile(ctx.user.id, input);
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
        const { currentFollowers, targetFollowers } = input;
        let progressPercentage = 0;
        const existing = await getFollowerProgress(ctx.user.id);
        const target = targetFollowers ?? existing?.targetFollowers ?? 2000;
        const current = currentFollowers ?? existing?.currentFollowers ?? 0;
        progressPercentage = Math.min(100, Math.max(0, (current / target) * 100));
        await upsertFollowerProgress(ctx.user.id, {
          currentFollowers,
          targetFollowers,
          progressPercentage: progressPercentage.toFixed(2),
        });
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
});

export type AppRouter = typeof appRouter;
