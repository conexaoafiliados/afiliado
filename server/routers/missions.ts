import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { isHttpUrl } from "../../shared/brands";
import {
  adminListMissionSubmissions,
  adminListMissions,
  createUserMission,
  getAllMissions,
  getMissionsByUserId,
  reviewMissionSubmission,
  saveMission,
  submitMissionProof,
} from "../db";
import { permissionProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const adminProcedure = permissionProcedure(ADMIN_PERMISSIONS.LEARNING_MANAGE);

const optionalHttp = z
  .union([
    z
      .string()
      .trim()
      .max(1024)
      .refine(isHttpUrl, { message: "Informe um link http(s) válido" }),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform(v => (v ? v : null));

export const missionsRouter = router({
  catalog: publicProcedure.query(async () => getAllMissions()),

  list: protectedProcedure.query(async ({ ctx }) => getMissionsByUserId(ctx.user.id)),

  /** Catálogo + status do usuário (para a UI de missões) */
  feed: protectedProcedure
    .input(z.object({ brandId: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const catalog = await getAllMissions();
      const mine = await getMissionsByUserId(ctx.user.id);
      const filtered = input?.brandId
        ? catalog.filter(m => ("brandId" in m ? m.brandId === input.brandId : false))
        : catalog;
      return filtered.map(m => {
        const row = mine.find(u => u.missionId === m.id);
        return {
          ...m,
          status: (row?.status ?? "pending") as "pending" | "in_progress" | "completed",
          pointsEarned: row?.pointsEarned ?? 0,
          validationStatus: (row as { validationStatus?: string } | undefined)?.validationStatus ?? "none",
          submissionUrl: (row as { submissionUrl?: string | null } | undefined)?.submissionUrl ?? null,
          reviewNote: (row as { reviewNote?: string | null } | undefined)?.reviewNote ?? null,
          rewardGranted: Boolean((row as { rewardGranted?: boolean } | undefined)?.rewardGranted),
        };
      });
    }),

  accept: protectedProcedure
    .input(z.object({ missionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await createUserMission(ctx.user.id, input.missionId);
      return { success: true };
    }),

  /** Envio de participação (diferente de validação/recompensa). */
  submitProof: protectedProcedure
    .input(
      z.object({
        missionId: z.number().int().positive(),
        submissionUrl: optionalHttp,
        submissionNote: z.string().trim().max(2000).nullish().transform(v => (v ? v : null)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await submitMissionProof({
          userId: ctx.user.id,
          missionId: input.missionId,
          submissionUrl: input.submissionUrl ?? null,
          submissionNote: input.submissionNote,
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Não foi possível enviar",
        });
      }
    }),

  admin: router({
    list: adminProcedure.query(async () => adminListMissions()),

    save: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          title: z.string().trim().min(3).max(255),
          description: z.string().trim().max(5000).nullish().transform(v => (v ? v : null)),
          category: z.enum(["growth", "engagement", "learning"]),
          difficulty: z.enum(["easy", "medium", "hard"]),
          reward: z.number().int().min(0).max(100000),
          brandId: z.number().int().positive().nullish().transform(v => v ?? null),
          requiresProof: z.boolean().default(false),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await saveMission(input);
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Falha ao salvar missão",
          });
        }
      }),

    submissions: adminProcedure
      .input(z.object({ pendingOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => adminListMissionSubmissions(input)),

    reviewSubmission: adminProcedure
      .input(
        z.object({
          userMissionId: z.number().int().positive(),
          decision: z.enum(["approved", "rejected"]),
          reviewNote: z.string().trim().max(2000).nullish().transform(v => (v ? v : null)),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await reviewMissionSubmission({
            userMissionId: input.userMissionId,
            reviewerId: ctx.user.id,
            decision: input.decision,
            reviewNote: input.reviewNote,
          });
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Falha na revisão",
          });
        }
      }),
  }),
});
