import { and, desc, eq, sql } from "drizzle-orm";
import {
  affiliateCoproducers,
  affiliateCoupons,
  affiliateLinks,
  affiliateMaterials,
  affiliateOrderShares,
  affiliateOrders,
  affiliatePointRules,
  affiliateProductPoints,
  affiliateSaleProducts,
  brandProducts,
  brands,
  users,
} from "../drizzle/schema";
import { DEFAULT_POINT_RULES, type PointRules } from "../shared/affiliateProgram";
import { getDb } from "./db";

const MIGRATION = "Execute supabase/migration_affiliate_program.sql no SQL Editor do Supabase.";

function missingTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist|affiliate_|42P01/i.test(message);
}

async function database() {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  return db;
}

export async function getPointRules(): Promise<PointRules & { ready: boolean; message?: string }> {
  try {
    const db = await database();
    const [row] = await db.select().from(affiliatePointRules).limit(1);
    if (!row) {
      const [created] = await db.insert(affiliatePointRules).values({ id: 1 }).returning();
      return { ready: true, ...pickRules(created) };
    }
    return { ready: true, ...pickRules(row) };
  } catch (error) {
    if (missingTable(error)) return { ready: false, ...DEFAULT_POINT_RULES, message: MIGRATION };
    throw error;
  }
}

function pickRules(row: {
  storyPoints: number;
  feedPoints: number;
  reelPoints: number;
  salePoints: number;
  redeemMinPoints: number;
  redeemMinSales: number;
  redeemItemLimit: number;
  redeemDays: number;
}): PointRules {
  return {
    storyPoints: row.storyPoints,
    feedPoints: row.feedPoints,
    reelPoints: row.reelPoints,
    salePoints: row.salePoints,
    redeemMinPoints: row.redeemMinPoints,
    redeemMinSales: row.redeemMinSales,
    redeemItemLimit: row.redeemItemLimit,
    redeemDays: row.redeemDays,
  };
}

export async function savePointRules(rules: PointRules) {
  const db = await database();
  await db
    .insert(affiliatePointRules)
    .values({ id: 1, ...rules, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: affiliatePointRules.id,
      set: { ...rules, updatedAt: new Date() },
    });
}

export async function listProductPoints() {
  try {
    const db = await database();
    const rows = await db
      .select({
        id: brandProducts.id,
        name: brandProducts.name,
        brandName: brands.name,
        pointsCost: affiliateProductPoints.pointsCost,
      })
      .from(brandProducts)
      .innerJoin(brands, eq(brands.id, brandProducts.brandId))
      .leftJoin(affiliateProductPoints, eq(affiliateProductPoints.brandProductId, brandProducts.id))
      .orderBy(brands.name, brandProducts.name);
    return { ready: true as const, products: rows };
  } catch (error) {
    if (missingTable(error)) return { ready: false as const, products: [], message: MIGRATION };
    throw error;
  }
}

export async function setProductPoints(brandProductId: number, pointsCost: number) {
  const db = await database();
  await db
    .insert(affiliateProductPoints)
    .values({ brandProductId, pointsCost, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: affiliateProductPoints.brandProductId,
      set: { pointsCost, updatedAt: new Date() },
    });
}

export async function listMaterials() {
  try {
    const db = await database();
    const rows = await db.select().from(affiliateMaterials).orderBy(desc(affiliateMaterials.createdAt));
    return { ready: true as const, materials: rows };
  } catch (error) {
    if (missingTable(error)) return { ready: false as const, materials: [], message: MIGRATION };
    throw error;
  }
}

export async function createMaterial(input: {
  title: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  createdBy: number;
}) {
  const db = await database();
  const [row] = await db.insert(affiliateMaterials).values(input).returning();
  return row;
}

export async function deleteMaterial(id: number) {
  const db = await database();
  await db.delete(affiliateMaterials).where(eq(affiliateMaterials.id, id));
}

const saleColumns = {
  id: brandProducts.id,
  name: brandProducts.name,
  slug: brandProducts.slug,
  description: brandProducts.description,
  imageUrls: brandProducts.imageUrls,
  brandName: brands.name,
  brandSlug: brands.slug,
  priceCents: affiliateSaleProducts.priceCents,
  compareAtCents: affiliateSaleProducts.compareAtCents,
  commissionCents: affiliateSaleProducts.commissionCents,
  promo: affiliateSaleProducts.promo,
};

export async function listSaleCatalog(publishedOnly: boolean) {
  try {
    const db = await database();
    const base = db
      .select(saleColumns)
      .from(brandProducts)
      .innerJoin(brands, eq(brands.id, brandProducts.brandId))
      .leftJoin(affiliateSaleProducts, eq(affiliateSaleProducts.brandProductId, brandProducts.id));
    const rows = await (publishedOnly
      ? base.where(and(eq(brandProducts.status, "published"), eq(brands.status, "published")))
      : base
    ).orderBy(brands.name, brandProducts.name);
    return { ready: true as const, products: rows };
  } catch (error) {
    if (missingTable(error)) return { ready: false as const, products: [], message: MIGRATION };
    throw error;
  }
}

export async function saveSaleProduct(input: {
  brandProductId: number;
  priceCents: number;
  compareAtCents: number | null;
  commissionCents: number;
  promo: boolean;
}) {
  const db = await database();
  await db
    .insert(affiliateSaleProducts)
    .values({ ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: affiliateSaleProducts.brandProductId,
      set: {
        priceCents: input.priceCents,
        compareAtCents: input.compareAtCents,
        commissionCents: input.commissionCents,
        promo: input.promo,
        updatedAt: new Date(),
      },
    });
}

export async function getPublishedSale(brandSlug: string, productSlug: string) {
  const catalog = await listSaleCatalog(true);
  if (!catalog.ready) return { ready: false as const, product: null, message: catalog.message };
  const product = catalog.products.find(item => item.brandSlug === brandSlug && item.slug === productSlug) ?? null;
  return { ready: true as const, product };
}

export async function findUserIdByUsername(username: string) {
  const db = await database();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase().trim()))
    .limit(1);
  return row?.id ?? null;
}

export async function createAffiliateOrder(input: {
  orderNsu: string;
  brandProductId: number;
  affiliateUserId: number | null;
  amountCents: number;
  commissionCents: number;
  checkoutUrl: string;
  couponCode: string | null;
}) {
  const db = await database();
  const [row] = await db.insert(affiliateOrders).values(input).returning();
  if (!row) return row;
  const shares: { orderId: number; userId: number; role: string; amountCents: number }[] = [];
  if (input.affiliateUserId && input.commissionCents > 0) {
    shares.push({
      orderId: row.id,
      userId: input.affiliateUserId,
      role: "affiliate",
      amountCents: input.commissionCents,
    });
  }
  const partners = await db
    .select()
    .from(affiliateCoproducers)
    .where(eq(affiliateCoproducers.brandProductId, input.brandProductId));
  for (const partner of partners) {
    if (partner.userId === input.affiliateUserId) continue;
    shares.push({
      orderId: row.id,
      userId: partner.userId,
      role: "coproducer",
      amountCents: partner.amountCents,
    });
  }
  if (shares.length) await db.insert(affiliateOrderShares).values(shares);
  return row;
}

export async function listCoproducers() {
  try {
    const db = await database();
    const rows = await db
      .select({
        id: affiliateCoproducers.id,
        brandProductId: affiliateCoproducers.brandProductId,
        userId: affiliateCoproducers.userId,
        username: users.username,
        name: users.name,
        amountCents: affiliateCoproducers.amountCents,
      })
      .from(affiliateCoproducers)
      .innerJoin(users, eq(users.id, affiliateCoproducers.userId))
      .orderBy(users.username);
    return { ready: true as const, people: rows };
  } catch (error) {
    if (missingTable(error)) return { ready: false as const, people: [], message: MIGRATION };
    throw error;
  }
}

export async function addCoproducer(brandProductId: number, username: string, amountCents: number) {
  const userId = await findUserIdByUsername(username);
  if (!userId) throw new Error("Não encontrei esse usuário.");
  const db = await database();
  await db
    .insert(affiliateCoproducers)
    .values({ brandProductId, userId, amountCents })
    .onConflictDoUpdate({
      target: [affiliateCoproducers.brandProductId, affiliateCoproducers.userId],
      set: { amountCents },
    });
}

export async function removeCoproducer(id: number) {
  const db = await database();
  await db.delete(affiliateCoproducers).where(eq(affiliateCoproducers.id, id));
}

export async function listCoupons() {
  try {
    const db = await database();
    const rows = await db
      .select({
        id: affiliateCoupons.id,
        userId: affiliateCoupons.userId,
        username: users.username,
        name: users.name,
        code: affiliateCoupons.code,
        discountPercent: affiliateCoupons.discountPercent,
        uses: sql<number>`(
          SELECT count(*)::int FROM affiliate_orders
          WHERE affiliate_orders."couponCode" = ${affiliateCoupons.code}
            AND affiliate_orders.status = 'paid'
        )`,
      })
      .from(affiliateCoupons)
      .innerJoin(users, eq(users.id, affiliateCoupons.userId))
      .orderBy(affiliateCoupons.code);
    return { ready: true as const, coupons: rows };
  } catch (error) {
    if (missingTable(error)) return { ready: false as const, coupons: [], message: MIGRATION };
    throw error;
  }
}

export async function saveCoupon(input: { username: string; code: string; discountPercent: number }) {
  const userId = await findUserIdByUsername(input.username);
  if (!userId) throw new Error("Não encontrei esse usuário.");
  const code = input.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4) throw new Error("O cupom precisa ter pelo menos 4 letras ou números.");
  const db = await database();
  await db
    .insert(affiliateCoupons)
    .values({ userId, code, discountPercent: input.discountPercent })
    .onConflictDoUpdate({
      target: affiliateCoupons.userId,
      set: { code, discountPercent: input.discountPercent },
    });
}

export async function deleteCoupon(id: number) {
  const db = await database();
  await db.delete(affiliateCoupons).where(eq(affiliateCoupons.id, id));
}

export async function findCoupon(code: string) {
  const db = await database();
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const [row] = await db.select().from(affiliateCoupons).where(eq(affiliateCoupons.code, normalized)).limit(1);
  return row ?? null;
}

export async function getAffiliateDesk(userId: number) {
  try {
    const db = await database();
    const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
    const [store] = await db
      .select()
      .from(affiliateLinks)
      .where(and(eq(affiliateLinks.userId, userId), eq(affiliateLinks.destination, "loja"), eq(affiliateLinks.custom, false)))
      .limit(1);
    const storeLink =
      store ??
      (
        await db
          .insert(affiliateLinks)
          .values({ userId, label: "Loja", destination: "loja", custom: false })
          .returning()
      )[0];
    const links = await db
      .select({
        id: affiliateLinks.id,
        label: affiliateLinks.label,
        destination: affiliateLinks.destination,
        brandProductId: affiliateLinks.brandProductId,
        brandSlug: brands.slug,
        productSlug: brandProducts.slug,
        note: affiliateLinks.note,
        custom: affiliateLinks.custom,
        clicks: affiliateLinks.clicks,
      })
      .from(affiliateLinks)
      .leftJoin(brandProducts, eq(brandProducts.id, affiliateLinks.brandProductId))
      .leftJoin(brands, eq(brands.id, brandProducts.brandId))
      .where(eq(affiliateLinks.userId, userId))
      .orderBy(affiliateLinks.createdAt);
    const [coupon] = await db
      .select({
        code: affiliateCoupons.code,
        discountPercent: affiliateCoupons.discountPercent,
        uses: sql<number>`(
          SELECT count(*)::int FROM affiliate_orders
          WHERE affiliate_orders."couponCode" = ${affiliateCoupons.code}
            AND affiliate_orders.status = 'paid'
        )`,
      })
      .from(affiliateCoupons)
      .where(eq(affiliateCoupons.userId, userId))
      .limit(1);
    const catalog = await listSaleCatalog(true);
    return {
      ready: true as const,
      username: user?.username ?? null,
      storeLink,
      links: links.filter(link => link.id !== storeLink?.id),
      coupon: coupon ?? null,
      products: catalog.products.filter(item => item.priceCents),
    };
  } catch (error) {
    if (missingTable(error)) {
      return {
        ready: false as const,
        message: MIGRATION,
        username: null,
        storeLink: null,
        links: [],
        coupon: null,
        products: [],
      };
    }
    throw error;
  }
}

export async function createAffiliateLink(input: {
  userId: number;
  label: string;
  destination: "loja" | "produto";
  brandProductId: number | null;
  custom: boolean;
  note?: string | null;
}) {
  const db = await database();
  if (!input.custom && input.destination === "produto" && input.brandProductId) {
    const [existing] = await db
      .select()
      .from(affiliateLinks)
      .where(
        and(
          eq(affiliateLinks.userId, input.userId),
          eq(affiliateLinks.brandProductId, input.brandProductId),
          eq(affiliateLinks.custom, false)
        )
      )
      .limit(1);
    if (existing) return existing;
  }
  const [row] = await db.insert(affiliateLinks).values(input).returning();
  return row;
}

export async function registerLinkClick(linkId: number) {
  try {
    const db = await database();
    await db
      .update(affiliateLinks)
      .set({ clicks: sql`${affiliateLinks.clicks} + 1` })
      .where(eq(affiliateLinks.id, linkId));
  } catch (error) {
    if (missingTable(error)) return;
    throw error;
  }
}

export async function confirmAffiliateOrder(input: {
  orderNsu: string;
  transactionNsu: string;
  invoiceSlug: string;
  captureMethod: string | null;
  paid: boolean;
}) {
  const db = await database();
  const [current] = await db
    .select()
    .from(affiliateOrders)
    .where(eq(affiliateOrders.orderNsu, input.orderNsu))
    .limit(1);
  if (!current) return null;
  const status = input.paid ? "paid" : current.status;
  const [row] = await db
    .update(affiliateOrders)
    .set({
      status,
      transactionNsu: input.transactionNsu,
      invoiceSlug: input.invoiceSlug,
      captureMethod: input.captureMethod,
      paidAt: input.paid ? current.paidAt ?? new Date() : current.paidAt,
    })
    .where(eq(affiliateOrders.id, current.id))
    .returning();
  return row;
}
