import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { DEFAULT_POINT_RULES } from "../../shared/affiliateProgram";
import { materialKind, uploadPublicFile } from "../_core/storage";
import { permissionProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createChallenge,
  createMaterial,
  deleteMaterial,
  getPointRules,
  listChallenges,
  listMaterials,
  listProductPoints,
  savePointRules,
  setChallengeStatus,
  setProductPoints,
} from "../affiliateProgramDb";

const staff = permissionProcedure([ADMIN_PERMISSIONS.BRANDS_MANAGE, ADMIN_PERMISSIONS.CAMPAIGNS_MANAGE]);

const rulesInput = z.object({
  storyPoints: z.number().int().min(0).max(1000),
  feedPoints: z.number().int().min(0).max(1000),
  reelPoints: z.number().int().min(0).max(1000),
  salePoints: z.number().int().min(0).max(1000),
  redeemMinPoints: z.number().int().min(0).max(100000),
  redeemMinSales: z.number().int().min(0).max(1000),
  redeemItemLimit: z.number().int().min(1).max(20),
  redeemDays: z.number().int().min(1).max(90),
});

function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : "Não foi possível salvar";
  throw new TRPCError({
    code: message.includes("migration_affiliate_program") ? "PRECONDITION_FAILED" : "BAD_REQUEST",
    message,
  });
}

export const affiliateProgramRouter = router({
  challenges: protectedProcedure.query(() => listChallenges()),
  points: protectedProcedure.query(async () => {
    const [rules, challenges, products] = await Promise.all([
      getPointRules(),
      listChallenges(),
      listProductPoints(),
    ]);
    const active = challenges.challenges.find(item => item.status === "active");
    return {
      ready: rules.ready && challenges.ready,
      message: rules.message ?? challenges.message,
      rules,
      mentionHandle: active?.instagramHandle ?? null,
      products: products.products.filter(item => (item.pointsCost ?? 0) > 0),
      balance: { points: 0, sales: 0, stories: 0, feed: 0, reels: 0 },
    };
  }),
  materials: protectedProcedure.query(() => listMaterials()),

  admin: router({
    challenges: staff.query(() => listChallenges()),
    createChallenge: staff
      .input(
        z.object({
          title: z.string().min(3).max(200),
          description: z.string().max(2000).optional(),
          brandId: z.number().int().positive().nullable().optional(),
          instagramHandle: z.string().min(2).max(100),
          startsAt: z.string().nullable().optional(),
          endsAt: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await createChallenge({
            ...input,
            startsAt: input.startsAt ? new Date(input.startsAt) : null,
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            createdBy: ctx.user.id,
          });
        } catch (error) {
          fail(error);
        }
      }),
    setChallengeStatus: staff
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "ended"]) }))
      .mutation(async ({ input }) => {
        try {
          await setChallengeStatus(input.id, input.status);
          return { ok: true };
        } catch (error) {
          fail(error);
        }
      }),
    rules: staff.query(() => getPointRules()),
    saveRules: staff.input(rulesInput).mutation(async ({ input }) => {
      try {
        await savePointRules(input);
        return { ok: true };
      } catch (error) {
        fail(error);
      }
    }),
    products: staff.query(() => listProductPoints()),
    setProductPoints: staff
      .input(z.object({ brandProductId: z.number().int().positive(), pointsCost: z.number().int().min(0).max(100000) }))
      .mutation(async ({ input }) => {
        try {
          await setProductPoints(input.brandProductId, input.pointsCost);
          return { ok: true };
        } catch (error) {
          fail(error);
        }
      }),
    materials: staff.query(() => listMaterials()),
    uploadMaterial: staff
      .input(
        z.object({
          title: z.string().min(2).max(160),
          base64: z.string().min(20),
          mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf", "video/mp4"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const url = await uploadPublicFile(
          `materials/${ctx.user.id}-${Date.now()}`,
          input.base64,
          input.mime
        );
        if (!url) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não foi possível guardar o arquivo. Use PNG, JPG, WEBP, GIF, PDF ou MP4 de até 8 MB.",
          });
        }
        const size = Buffer.from(input.base64, "base64").length;
        try {
          return await createMaterial({
            title: input.title,
            fileUrl: url,
            mimeType: input.mime,
            sizeBytes: size,
            kind: materialKind(input.mime),
            createdBy: ctx.user.id,
          });
        } catch (error) {
          fail(error);
        }
      }),
    deleteMaterial: staff
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteMaterial(input.id);
        return { ok: true };
      }),
  }),
});

export { DEFAULT_POINT_RULES };
