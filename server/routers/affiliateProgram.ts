import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { materialKind, uploadPublicFile } from "../_core/storage";
import { permissionProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { checkInfinitePayPayment, createInfinitePayLink, isInfinitePayConfigured } from "../_core/infinitepay";
import {
  confirmAffiliateOrder,
  createAffiliateOrder,
  createMaterial,
  deleteMaterial,
  addCoproducer,
  createAffiliateLink,
  deleteCoupon,
  findCoupon,
  findUserIdByUsername,
  getAffiliateDesk,
  getPointRules,
  getPublishedSale,
  listCoproducers,
  listCoupons,
  listMaterials,
  listProductPoints,
  listSaleCatalog,
  registerLinkClick,
  removeCoproducer,
  saveCoupon,
  savePointRules,
  saveSaleProduct,
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
  points: protectedProcedure.query(async () => {
    const [rules, products] = await Promise.all([getPointRules(), listProductPoints()]);
    return {
      ready: rules.ready && products.ready,
      message: rules.message ?? (products.ready ? undefined : products.message),
      rules,
      mentionHandle: null as string | null,
      products: products.products.filter(item => (item.pointsCost ?? 0) > 0),
      balance: { points: 0, sales: 0, stories: 0, feed: 0, reels: 0 },
    };
  }),
  materials: protectedProcedure.query(() => listMaterials()),
  catalog: protectedProcedure.query(() => listSaleCatalog(true)),
  vitrine: publicProcedure.query(() => listSaleCatalog(true)),
  offer: publicProcedure
    .input(z.object({ brandSlug: z.string().min(1).max(80), productSlug: z.string().min(1).max(80) }))
    .query(async ({ input }) => getPublishedSale(input.brandSlug, input.productSlug)),
  checkout: publicProcedure
    .input(
      z.object({
        brandSlug: z.string().min(1).max(80),
        productSlug: z.string().min(1).max(80),
        affiliateUsername: z.string().min(1).max(50).optional(),
        couponCode: z.string().min(4).max(32).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!isInfinitePayConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Pagamento ainda não configurado. Defina INFINITEPAY_HANDLE no servidor.",
        });
      }
      const found = await getPublishedSale(input.brandSlug, input.productSlug);
      if (!found.ready) throw new TRPCError({ code: "PRECONDITION_FAILED", message: found.message ?? "Catálogo indisponível" });
      const product = found.product;
      if (!product?.priceCents) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este produto ainda não tem preço de venda." });
      }
      let affiliateUserId = input.affiliateUsername ? await findUserIdByUsername(input.affiliateUsername) : null;
      let amountCents = product.priceCents;
      let couponCode: string | null = null;
      if (input.couponCode) {
        const coupon = await findCoupon(input.couponCode);
        if (!coupon) throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom não encontrado." });
        couponCode = coupon.code;
        amountCents = product.priceCents - Math.floor((product.priceCents * coupon.discountPercent) / 100);
        if (amountCents < 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "O desconto desse cupom passa do preço do produto." });
        }
        if (!affiliateUserId) affiliateUserId = coupon.userId;
      }
      const orderNsu = `cx${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const origin = ENV.appUrl;
      const url = await createInfinitePayLink({
        orderNsu,
        description: product.name,
        priceCents: amountCents,
        redirectUrl: `${origin}/oferta/retorno`,
        webhookUrl: `${origin}/api/infinitepay/webhook`,
      });
      await createAffiliateOrder({
        orderNsu,
        brandProductId: product.id,
        affiliateUserId,
        amountCents,
        commissionCents: affiliateUserId ? product.commissionCents ?? 0 : 0,
        checkoutUrl: url,
        couponCode,
      });
      return { url };
    }),
  desk: protectedProcedure.query(({ ctx }) => getAffiliateDesk(ctx.user.id)),
  createLink: protectedProcedure
    .input(
      z.object({
        label: z.string().min(2).max(120),
        destination: z.enum(["loja", "produto"]),
        brandProductId: z.number().int().positive().nullable(),
        custom: z.boolean(),
        note: z.string().max(40).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.destination === "produto" && !input.brandProductId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escolha o produto desse link." });
      }
      try {
        const link = await createAffiliateLink({
          userId: ctx.user.id,
          label: input.label,
          destination: input.destination,
          brandProductId: input.destination === "produto" ? input.brandProductId : null,
          custom: input.custom,
          note: input.note ?? null,
        });
        return { id: link?.id ?? null };
      } catch (error) {
        fail(error);
      }
    }),
  recordClick: publicProcedure
    .input(z.object({ linkId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await registerLinkClick(input.linkId);
      return { ok: true };
    }),
  confirmReturn: publicProcedure
    .input(
      z.object({
        orderNsu: z.string().min(1).max(80),
        transactionNsu: z.string().min(1).max(80),
        slug: z.string().min(1).max(80),
      })
    )
    .mutation(async ({ input }) => {
      const check = await checkInfinitePayPayment(input);
      const order = await confirmAffiliateOrder({
        orderNsu: input.orderNsu,
        transactionNsu: input.transactionNsu,
        invoiceSlug: input.slug,
        captureMethod: check.captureMethod,
        paid: check.paid,
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      return { paid: check.paid, status: order.status };
    }),

  admin: router({
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
    sales: staff.query(() => listSaleCatalog(false)),
    coproducers: staff.query(() => listCoproducers()),
    addCoproducer: staff
      .input(
        z.object({
          brandProductId: z.number().int().positive(),
          username: z.string().min(1).max(50),
          amountCents: z.number().int().positive().max(10_000_000),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await addCoproducer(input.brandProductId, input.username, input.amountCents);
          return { ok: true };
        } catch (error) {
          fail(error);
        }
      }),
    removeCoproducer: staff.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        await removeCoproducer(input.id);
        return { ok: true };
      } catch (error) {
        fail(error);
      }
    }),
    coupons: staff.query(() => listCoupons()),
    saveCoupon: staff
      .input(
        z.object({
          username: z.string().min(1).max(50),
          code: z.string().min(4).max(32),
          discountPercent: z.number().int().min(0).max(90),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await saveCoupon(input);
          return { ok: true };
        } catch (error) {
          fail(error);
        }
      }),
    deleteCoupon: staff.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        await deleteCoupon(input.id);
        return { ok: true };
      } catch (error) {
        fail(error);
      }
    }),
    saveSale: staff
      .input(
        z.object({
          brandProductId: z.number().int().positive(),
          priceCents: z.number().int().positive().max(10_000_000),
          compareAtCents: z.number().int().positive().max(10_000_000).nullable(),
          commissionCents: z.number().int().min(0).max(10_000_000),
          promo: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          if (input.compareAtCents != null && input.compareAtCents <= input.priceCents) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "O preço antigo precisa ser maior que o preço de venda." });
          }
          await saveSaleProduct(input);
          return { ok: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          fail(error);
        }
      }),
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
