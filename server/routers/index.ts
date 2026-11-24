import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getCreatorProfile,
  getFollowerProgress,
  getUserPublicProfile,
  recordFollowerSnapshot,
  syncFollowerAchievements,
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
import { instagramRouter } from "./instagram";
import { notificationsRouter } from "./notifications";
import { followsRouter } from "./follows";
import { learningRouter } from "./learning";
import { announcementsRouter } from "./announcements";
import { trainingsRouter } from "./trainings";
import { adminRouter } from "./admin";
import { brandsRouter } from "./brands";
import { campaignsRouter } from "./campaigns";
import { movementRouter } from "./movement";
import { affiliateProgramRouter } from "./affiliateProgram";

export const appRouter = router({
  system: systemRouter,

  auth: authRouter,

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getCreatorProfile(ctx.user.id);
      return {
        ...(profile ?? {}),
        userId: ctx.user.id,
        name: ctx.user.name ?? "",
      };
    }),

    update: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras").max(120).optional(),
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
          websiteUrl: z.union([z.string().url("O site precisa começar com http:// ou https://"), z.literal("")]).optional(),
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

        let savedName = ctx.user.name ?? "";
        if (name) {
          const row = await updateUserById(ctx.user.id, { name });
          savedName = row.name ?? name;
        }

        const profileUpdate: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(profileFields)) {
          if (value !== undefined) profileUpdate[key] = value;
        }
        if (websiteUrl === "") profileUpdate.websiteUrl = null;
        else if (websiteUrl) profileUpdate.websiteUrl = websiteUrl;

        const stamp = Date.now();
        if (profileImageBase64) {
          const url = await uploadImage("avatars", `profile-${ctx.user.id}`, profileImageBase64, profileImageMime);
          if (!url) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Não consegui gravar a foto. Confira o bucket avatars no Supabase.",
            });
          }
          profileUpdate.profileImageUrl = `${url}?v=${stamp}`;
        }
        if (bannerImageBase64) {
          const url = await uploadImage("avatars", `banner-${ctx.user.id}`, bannerImageBase64, bannerImageMime);
          if (!url) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Não consegui gravar o banner. Confira o bucket avatars no Supabase.",
            });
          }
          profileUpdate.bannerImageUrl = `${url}?v=${stamp}`;
        }

        if (Object.keys(profileUpdate).length > 0) {
          await upsertCreatorProfile(ctx.user.id, profileUpdate as Partial<import("../../drizzle/schema").InsertCreatorProfile>);
        }
        const profile = await getCreatorProfile(ctx.user.id);
        return { ...(profile ?? {}), userId: ctx.user.id, name: savedName };
      }),

    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getCreatorProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        return profile;
      }),

    getByUsername: protectedProcedure
      .input(z.object({ username: z.string().min(1).max(50) }))
      .query(async ({ ctx, input }) => {
        const profile = await getUserPublicProfile(input.username, ctx.user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Creator não encontrado" });
        return profile;
      }),
  }),

  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getFollowerProgress(ctx.user.id);
      if (!progress) {
        return {
          userId: ctx.user.id,
          currentFollowers: 0,
          targetFollowers: 2000,
          progressPercentage: "0",
        };
      }

      const current = progress.currentFollowers ?? 0;
      await syncFollowerAchievements(ctx.user.id, current);
      const existingTarget = progress.targetFollowers ?? 2000;
      const { targetFollowers, progressPercentage } = resolveFollowerGoal(existingTarget, current);
      const newPct = progressPercentage.toFixed(2);

      if (targetFollowers !== existingTarget || newPct !== String(progress.progressPercentage)) {
        await upsertFollowerProgress(ctx.user.id, {
          targetFollowers,
          progressPercentage: newPct,
          lastUpdated: new Date(),
        });
        return (await getFollowerProgress(ctx.user.id))!;
      }

      return progress;
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
  instagram: instagramRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
  follows: followsRouter,
  learning: learningRouter,
  announcements: announcementsRouter,
  trainings: trainingsRouter,
  admin: adminRouter,
  brands: brandsRouter,
  campaigns: campaignsRouter,
  movement: movementRouter,
  affiliateProgram: affiliateProgramRouter,

  users: router({
    search: protectedProcedure
      .input(z.object({ q: z.string().min(1).max(30) }))
      .query(async ({ input }) => searchUsersByUsername(input.q)),
  }),
});

export type AppRouter = typeof appRouter;
