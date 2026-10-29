import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import {
  ACCENT_COLOR_REGEX,
  BRAND_STATUSES,
  OFFER_CHANNELS,
  SLUG_HINT,
  canTransitionStatus,
  getBrandPublishIssues,
  getProductPublishIssues,
  isHttpUrl,
  isValidSlug,
} from "../../shared/brands";
import {
  BrandsDbError,
  adminGetBrand,
  adminListBrands,
  createBrand,
  createProduct,
  deleteOffer,
  getBrandRow,
  getProductRow,
  getPublishedBrandBySlug,
  getPublishedProduct,
  listPublishedBrands,
  listPublishedProducts,
  saveOffer,
  setBrandStatus,
  setProductStatus,
  updateBrand,
  updateProduct,
} from "../brandsDb";
import { uploadImage } from "../_core/storage";
import { permissionProcedure, publicProcedure, router } from "../_core/trpc";

const adminProcedure = permissionProcedure(ADMIN_PERMISSIONS.BRANDS_MANAGE);

/** Converte erros de domínio do banco em respostas tRPC. */
export function toTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof BrandsDbError) {
    const code =
      error.code === "SLUG_TAKEN"
        ? "CONFLICT"
        : error.code === "NOT_FOUND"
          ? "NOT_FOUND"
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

const accentColorSchema = z
  .union([z.string().trim().regex(ACCENT_COLOR_REGEX, "Use uma cor no formato #RRGGBB"), z.literal(""), z.null()])
  .optional()
  .transform(v => (v ? v.toLowerCase() : null));

const brandInput = z.object({
  id: z.number().int().positive().optional(),
  slug: slugSchema,
  name: z.string().trim().min(2, "Informe o nome da marca").max(120),
  logoUrl: optionalUrl(512),
  coverUrl: optionalUrl(512),
  description: optionalText(5000),
  communicationConcept: optionalText(255),
  accentColor: accentColorSchema,
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const productInput = z.object({
  id: z.number().int().positive().optional(),
  brandId: z.number().int().positive(),
  slug: slugSchema,
  name: z.string().trim().min(2, "Informe o nome do produto").max(160),
  description: optionalText(5000),
  category: optionalText(80),
  imageUrls: z.array(httpUrl(512)).max(8).default([]),
  usageGuidelines: optionalText(5000),
  approvedInfo: optionalText(5000),
  referenceMaterials: z
    .array(z.object({ label: z.string().trim().min(1).max(120), url: httpUrl(1024) }))
    .max(10)
    .default([]),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const offerInput = z.object({
  id: z.number().int().positive().optional(),
  brandProductId: z.number().int().positive(),
  channel: z.enum(OFFER_CHANNELS),
  label: optionalText(120),
  url: httpUrl(1024),
  notes: optionalText(1000),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;
/** ~1,5 MB binário em base64; o handler da Vercel limita o corpo a 4 MB. */
const MAX_IMAGE_BASE64_CHARS = 2_100_000;

export const brandsRouter = router({
  // -------------------------------------------------------------------------
  // Público — somente marcas e produtos PUBLICADOS
  // -------------------------------------------------------------------------
  listPublished: publicProcedure.query(async () => listPublishedBrands()),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().trim().toLowerCase().min(1).max(80) }))
    .query(async ({ input }) => {
      const brand = await getPublishedBrandBySlug(input.slug);
      if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
      const products = await listPublishedProducts(brand.id);
      return { brand, products };
    }),

  getProduct: publicProcedure
    .input(
      z.object({
        brandSlug: z.string().trim().toLowerCase().min(1).max(80),
        productSlug: z.string().trim().toLowerCase().min(1).max(80),
      })
    )
    .query(async ({ input }) => {
      const brand = await getPublishedBrandBySlug(input.brandSlug);
      if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
      const product = await getPublishedProduct(brand.id, input.productSlug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
      return { brand, product };
    }),

  // -------------------------------------------------------------------------
  // Administração — exige a permissão brands.manage (ou admin da plataforma)
  // -------------------------------------------------------------------------
  admin: router({
    list: adminProcedure.query(async () => adminListBrands()),

    get: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      try {
        const data = await adminGetBrand(input.id);
        if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
        return data;
      } catch (error) {
        return toTrpcError(error);
      }
    }),

    saveBrand: adminProcedure.input(brandInput).mutation(async ({ ctx, input }) => {
      try {
        const { id, ...values } = input;
        if (!id) return await createBrand(values, ctx.user.id);

        const current = await getBrandRow(id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
        if (current.status === "published") {
          const issues = getBrandPublishIssues(values);
          if (issues.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Marca publicada não pode ficar incompleta: ${issues.join(" ")}`,
            });
          }
        }
        return await updateBrand(id, values);
      } catch (error) {
        return toTrpcError(error);
      }
    }),

    setBrandStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(BRAND_STATUSES) }))
      .mutation(async ({ input }) => {
        try {
          const current = await getBrandRow(input.id);
          if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
          if (!canTransitionStatus(current.status as (typeof BRAND_STATUSES)[number], input.status)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                current.status === "archived"
                  ? "Marca arquivada só pode ser restaurada para rascunho."
                  : "A marca já está nesse status.",
            });
          }
          if (input.status === "published") {
            const issues = getBrandPublishIssues(current);
            if (issues.length) throw new TRPCError({ code: "BAD_REQUEST", message: issues.join(" ") });
          }
          return await setBrandStatus(input.id, input.status);
        } catch (error) {
          return toTrpcError(error);
        }
      }),

    saveProduct: adminProcedure.input(productInput).mutation(async ({ input }) => {
      try {
        const { id, brandId, ...values } = input;
        if (!id) {
          const brand = await getBrandRow(brandId);
          if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Marca não encontrada" });
          if (brand.status === "archived") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Marca arquivada não aceita novos produtos. Restaure-a primeiro.",
            });
          }
          return await createProduct(brandId, values);
        }

        const current = await getProductRow(id);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        if (current.brandId !== brandId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível mover o produto para outra marca." });
        }
        if (current.status === "published") {
          const issues = getProductPublishIssues(values);
          if (issues.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Produto publicado não pode ficar incompleto: ${issues.join(" ")}`,
            });
          }
        }
        return await updateProduct(id, values);
      } catch (error) {
        return toTrpcError(error);
      }
    }),

    setProductStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(BRAND_STATUSES) }))
      .mutation(async ({ input }) => {
        try {
          const current = await getProductRow(input.id);
          if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
          if (!canTransitionStatus(current.status as (typeof BRAND_STATUSES)[number], input.status)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                current.status === "archived"
                  ? "Produto arquivado só pode ser restaurado para rascunho."
                  : "O produto já está nesse status.",
            });
          }
          if (input.status === "published") {
            const issues = getProductPublishIssues(current);
            if (issues.length) throw new TRPCError({ code: "BAD_REQUEST", message: issues.join(" ") });
          }
          return await setProductStatus(input.id, input.status);
        } catch (error) {
          return toTrpcError(error);
        }
      }),

    saveOffer: adminProcedure.input(offerInput).mutation(async ({ input }) => {
      try {
        const { id, brandProductId, ...values } = input;
        const product = await getProductRow(brandProductId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        return await saveOffer(brandProductId, values, id);
      } catch (error) {
        return toTrpcError(error);
      }
    }),

    deleteOffer: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        const ok = await deleteOffer(input.id);
        if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Oferta não encontrada" });
        return { success: true };
      } catch (error) {
        return toTrpcError(error);
      }
    }),

    uploadImage: adminProcedure
      .input(
        z.object({
          kind: z.enum(["logo", "cover", "product"]),
          base64: z.string().min(20).max(MAX_IMAGE_BASE64_CHARS),
          mime: z.enum(IMAGE_MIMES),
        })
      )
      .mutation(async ({ input }) => {
        const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const url = await uploadImage("avatars", `brands/${input.kind}-${unique}`, input.base64, input.mime);
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
