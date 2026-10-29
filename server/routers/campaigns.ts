import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { isHttpUrl, isValidSlug, SLUG_HINT } from "../../shared/brands";
import { CAMPAIGN_STATUSES, CONTENT_FORMATS } from "../../shared/campaigns";
import {
  CampaignsDbError,
  adminGetCampaign,
  adminListApplications,
  adminListCampaigns,
  applyToCampaign,
  createCampaign,
  getMyApplication,
  getVisibleCampaignBySlug,
  listBrandOptionsForCampaigns,
  listVisibleCampaigns,
  reviewApplication,
  reviewDelivery,
  setCampaignStatus,
  submitDelivery,
  updateCampaign,
} from "../campaignsDb";
import { uploadImage } from "../_core/storage";
import { permissionProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const adminProcedure = permissionProcedure(ADMIN_PERMISSIONS.CAMPAIGNS_MANAGE);

export function campaignsToTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof CampaignsDbError) {
    const code =
      error.code === "SLUG_TAKEN" || error.code === "DUPLICATE_APPLICATION"
        ? "CONFLICT"
        : error.code === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.code === "NOT_ALLOWED" || error.code === "INVALID_TRANSITION"
            ? "FORBIDDEN"
            : error.code === "VALIDATION" || error.code === "INVALID_PRODUCTS"
              ? "BAD_REQUEST"
              : "PRECONDITION_FAILED";
    throw new TRPCError({ code, message: error.message });
  }
  throw error;
}

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidSlug, { message: `Identificador de URL inválido. ${SLUG_HINT}` });

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(isHttpUrl, { message: "Informe um link http(s) válido" });

const optionalUrl = (max: number) =>
  z
    .union([httpUrl(max), z.literal(""), z.null()])
    .optional()
    .transform(v => (v ? v : null));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform(v => (v ? v : null));

const optionalDate = z
  .union([z.date(), z.string().min(1).max(40), z.literal(""), z.null()])
  .optional()
  .transform(v => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Data inválida." });
    return d;
  });

const sampleAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  street: z.string().trim().min(2).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(2),
  zip: z.string().trim().min(8).max(12),
});

const campaignInput = z.object({
  id: z.number().int().positive().optional(),
  brandId: z.number().int().positive(),
  slug: slugSchema,
  title: z.string().trim().min(3, "Informe o título").max(200),
  description: optionalText(5000),
  coverUrl: optionalUrl(512),
  briefing: optionalText(20000),
  participationCriteria: optionalText(5000),
  expectedDeliverables: optionalText(5000),
  contentFormats: z.array(z.enum(CONTENT_FORMATS)).max(CONTENT_FORMATS.length).default([]),
  applicationOpensAt: optionalDate,
  applicationClosesAt: optionalDate,
  deliveryDeadline: optionalDate,
  sampleConditions: optionalText(5000),
  commissionConditions: optionalText(5000),
  compensationConditions: optionalText(5000),
  requiresSampleAddress: z.boolean().default(false),
  requiresRepostAuth: z.boolean().default(false),
  requiresAdUsageAuth: z.boolean().default(false),
  productIds: z.array(z.number().int().positive()).max(50).default([]),
});

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_IMAGE_BASE64_CHARS = 2_100_000;

export const campaignsRouter = router({
  listVisible: publicProcedure
    .input(
      z
        .object({
          brandId: z.number().int().positive().optional(),
          brandProductId: z.number().int().positive().optional(),
          includeClosed: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => listVisibleCampaigns(input)),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().trim().toLowerCase().min(1).max(80) }))
    .query(async ({ input }) => {
      const campaign = await getVisibleCampaignBySlug(input.slug);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });
      return campaign;
    }),

  myApplication: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => getMyApplication(input.campaignId, ctx.user.id)),

  submitApplication: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        message: optionalText(2000),
        sampleAddress: sampleAddressSchema.nullish(),
        allowRepost: z.boolean().default(false),
        allowAdUsage: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await applyToCampaign({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          message: input.message ?? null,
          sampleAddress: input.sampleAddress ?? null,
          allowRepost: input.allowRepost,
          allowAdUsage: input.allowAdUsage,
        });
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

  submitDelivery: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        contentUrl: httpUrl(1024),
        note: optionalText(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await submitDelivery({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          contentUrl: input.contentUrl,
          note: input.note ?? null,
        });
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

  admin: router({
    brandOptions: adminProcedure.query(async () => {
      try {
        return await listBrandOptionsForCampaigns();
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

    list: adminProcedure.query(async () => {
      try {
        return await adminListCampaigns();
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

    get: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      try {
        const data = await adminGetCampaign(input.id);
        if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Campanha não encontrada" });
        return data;
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

    save: adminProcedure.input(campaignInput).mutation(async ({ ctx, input }) => {
      try {
        const { id, productIds, ...values } = input;
        if (!id) return await createCampaign(values, productIds, ctx.user.id);
        return await updateCampaign(id, values, productIds);
      } catch (error) {
        return campaignsToTrpcError(error);
      }
    }),

    setStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(CAMPAIGN_STATUSES) }))
      .mutation(async ({ input }) => {
        try {
          return await setCampaignStatus(input.id, input.status);
        } catch (error) {
          return campaignsToTrpcError(error);
        }
      }),

    listApplications: adminProcedure
      .input(z.object({ campaignId: z.number().int().positive() }))
      .query(async ({ input }) => {
        try {
          return await adminListApplications(input.campaignId);
        } catch (error) {
          return campaignsToTrpcError(error);
        }
      }),

    reviewApplication: adminProcedure
      .input(
        z.object({
          applicationId: z.number().int().positive(),
          status: z.enum(["approved", "rejected"]),
          reviewNote: optionalText(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await reviewApplication({
            applicationId: input.applicationId,
            reviewerId: ctx.user.id,
            status: input.status,
            reviewNote: input.reviewNote ?? null,
          });
        } catch (error) {
          return campaignsToTrpcError(error);
        }
      }),

    reviewDelivery: adminProcedure
      .input(
        z.object({
          deliveryId: z.number().int().positive(),
          status: z.enum(["approved", "changes_requested"]),
          revisionNote: optionalText(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await reviewDelivery({
            deliveryId: input.deliveryId,
            reviewerId: ctx.user.id,
            status: input.status,
            revisionNote: input.revisionNote ?? null,
          });
        } catch (error) {
          return campaignsToTrpcError(error);
        }
      }),

    uploadCover: adminProcedure
      .input(
        z.object({
          base64: z.string().min(20).max(MAX_IMAGE_BASE64_CHARS),
          mime: z.enum(IMAGE_MIMES),
        })
      )
      .mutation(async ({ input }) => {
        const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const url = await uploadImage("avatars", `campaigns/cover-${unique}`, input.base64, input.mime);
        if (!url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível enviar a imagem. Confira o bucket 'avatars' e SUPABASE_SERVICE_ROLE_KEY.",
          });
        }
        return { url };
      }),
  }),
});
