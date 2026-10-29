import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  brandProductOffers,
  brandProducts,
  brands,
  creatorPreferences,
  userBrandInterests,
  userInterests,
  type Brand,
  type BrandProduct,
  type BrandProductOffer,
} from "../drizzle/schema";
import type { BrandStatus, InterestKey } from "../shared/brands";
import { getDb } from "./db";

/** Erros de domínio mapeados para TRPCError nos routers. */
export type BrandsDbErrorCode = "SLUG_TAKEN" | "NOT_FOUND" | "MIGRATION_PENDING" | "NO_DATABASE";

export class BrandsDbError extends Error {
  constructor(
    public readonly code: BrandsDbErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BrandsDbError";
  }
}

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

function translate(error: unknown): never {
  const code = pgCode(error);
  if (code === "23505") throw new BrandsDbError("SLUG_TAKEN", "Este identificador de URL já está em uso.");
  if (code === "42P01") {
    throw new BrandsDbError(
      "MIGRATION_PENDING",
      "As tabelas de marcas ainda não existem. Aplique supabase/migration_movimento_etapa1.sql."
    );
  }
  throw error;
}

let warnedMissing = false;

/** Leituras públicas degradam para vazio se a migração ainda não foi aplicada. */
async function safeRead<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (pgCode(error) === "42P01") {
      if (!warnedMissing) {
        warnedMissing = true;
        console.warn("[Brands] tabelas ausentes — aplique supabase/migration_movimento_etapa1.sql");
      }
      return fallback;
    }
    throw error;
  }
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new BrandsDbError("NO_DATABASE", "Banco de dados indisponível.");
  return db;
}

// ---------------------------------------------------------------------------
// Tipos de saída
// ---------------------------------------------------------------------------

/** Campos seguros para exibição pública (sem createdBy/status interno). */
export type PublicBrand = Pick<
  Brand,
  "id" | "slug" | "name" | "logoUrl" | "coverUrl" | "description" | "communicationConcept" | "accentColor"
>;

export type PublicOffer = Pick<BrandProductOffer, "id" | "channel" | "label" | "url" | "notes">;

export type PublicProduct = Pick<
  BrandProduct,
  | "id"
  | "brandId"
  | "slug"
  | "name"
  | "description"
  | "category"
  | "imageUrls"
  | "usageGuidelines"
  | "approvedInfo"
  | "referenceMaterials"
> & { offers: PublicOffer[] };

const publicBrandColumns = {
  id: brands.id,
  slug: brands.slug,
  name: brands.name,
  logoUrl: brands.logoUrl,
  coverUrl: brands.coverUrl,
  description: brands.description,
  communicationConcept: brands.communicationConcept,
  accentColor: brands.accentColor,
};

const publicProductColumns = {
  id: brandProducts.id,
  brandId: brandProducts.brandId,
  slug: brandProducts.slug,
  name: brandProducts.name,
  description: brandProducts.description,
  category: brandProducts.category,
  imageUrls: brandProducts.imageUrls,
  usageGuidelines: brandProducts.usageGuidelines,
  approvedInfo: brandProducts.approvedInfo,
  referenceMaterials: brandProducts.referenceMaterials,
};

// ---------------------------------------------------------------------------
// Leitura pública (somente conteúdo publicado)
// ---------------------------------------------------------------------------

export async function listPublishedBrands(): Promise<(PublicBrand & { productCount: number })[]> {
  const db = await getDb();
  if (!db) return [];
  return safeRead([], async () => {
    const rows = await db
      .select(publicBrandColumns)
      .from(brands)
      .where(eq(brands.status, "published"))
      .orderBy(asc(brands.sortOrder), asc(brands.name));
    if (rows.length === 0) return [];

    const counts = await db
      .select({ brandId: brandProducts.brandId, count: sql<number>`count(*)::int` })
      .from(brandProducts)
      .where(and(inArray(brandProducts.brandId, rows.map(r => r.id)), eq(brandProducts.status, "published")))
      .groupBy(brandProducts.brandId);
    const byBrand = new Map(counts.map(c => [c.brandId, c.count]));
    return rows.map(r => ({ ...r, productCount: byBrand.get(r.id) ?? 0 }));
  });
}

export async function getPublishedBrandBySlug(slug: string): Promise<PublicBrand | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return safeRead(undefined, async () => {
    const rows = await db
      .select(publicBrandColumns)
      .from(brands)
      .where(and(eq(brands.slug, slug), eq(brands.status, "published")))
      .limit(1);
    return rows[0];
  });
}

async function attachActiveOffers(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  products: Omit<PublicProduct, "offers">[]
): Promise<PublicProduct[]> {
  if (products.length === 0) return [];
  const offers = await db
    .select({
      id: brandProductOffers.id,
      brandProductId: brandProductOffers.brandProductId,
      channel: brandProductOffers.channel,
      label: brandProductOffers.label,
      url: brandProductOffers.url,
      notes: brandProductOffers.notes,
    })
    .from(brandProductOffers)
    .where(
      and(
        inArray(brandProductOffers.brandProductId, products.map(p => p.id)),
        eq(brandProductOffers.isActive, true)
      )
    )
    .orderBy(asc(brandProductOffers.sortOrder), asc(brandProductOffers.id));

  return products.map(p => ({
    ...p,
    offers: offers
      .filter(o => o.brandProductId === p.id)
      .map(({ brandProductId: _ignored, ...o }) => o),
  }));
}

export async function listPublishedProducts(brandId: number): Promise<PublicProduct[]> {
  const db = await getDb();
  if (!db) return [];
  return safeRead([], async () => {
    const rows = await db
      .select(publicProductColumns)
      .from(brandProducts)
      .where(and(eq(brandProducts.brandId, brandId), eq(brandProducts.status, "published")))
      .orderBy(asc(brandProducts.sortOrder), asc(brandProducts.name));
    return attachActiveOffers(db, rows);
  });
}

export async function getPublishedProduct(brandId: number, productSlug: string): Promise<PublicProduct | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  return safeRead(undefined, async () => {
    const rows = await db
      .select(publicProductColumns)
      .from(brandProducts)
      .where(
        and(
          eq(brandProducts.brandId, brandId),
          eq(brandProducts.slug, productSlug),
          eq(brandProducts.status, "published")
        )
      )
      .limit(1);
    const [withOffers] = await attachActiveOffers(db, rows);
    return withOffers;
  });
}

// ---------------------------------------------------------------------------
// Administração
// ---------------------------------------------------------------------------

export async function adminListBrands() {
  const db = await getDb();
  if (!db) return [];
  return safeRead([], async () => {
    const rows = await db.select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.name));
    const counts = await db
      .select({
        brandId: brandProducts.brandId,
        status: brandProducts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(brandProducts)
      .groupBy(brandProducts.brandId, brandProducts.status);
    return rows.map(r => {
      const mine = counts.filter(c => c.brandId === r.id);
      return {
        ...r,
        productCount: mine.reduce((acc, c) => acc + c.count, 0),
        publishedProductCount: mine.find(c => c.status === "published")?.count ?? 0,
      };
    });
  });
}

export async function adminGetBrand(id: number) {
  const db = await requireDb();
  try {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!brand) return undefined;
    const products = await db
      .select()
      .from(brandProducts)
      .where(eq(brandProducts.brandId, id))
      .orderBy(asc(brandProducts.sortOrder), asc(brandProducts.name));
    const offers = products.length
      ? await db
          .select()
          .from(brandProductOffers)
          .where(inArray(brandProductOffers.brandProductId, products.map(p => p.id)))
          .orderBy(asc(brandProductOffers.sortOrder), asc(brandProductOffers.id))
      : [];
    return {
      brand,
      products: products.map(p => ({ ...p, offers: offers.filter(o => o.brandProductId === p.id) })),
    };
  } catch (error) {
    return translate(error);
  }
}

export async function getBrandRow(id: number): Promise<Brand | undefined> {
  const db = await requireDb();
  try {
    const [row] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    return row;
  } catch (error) {
    return translate(error);
  }
}

export type BrandInput = {
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  communicationConcept: string | null;
  accentColor: string | null;
  sortOrder?: number;
};

export async function createBrand(input: BrandInput, createdBy: number): Promise<Brand> {
  const db = await requireDb();
  try {
    const [row] = await db
      .insert(brands)
      .values({ ...input, sortOrder: input.sortOrder ?? 0, status: "draft", createdBy })
      .returning();
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function updateBrand(id: number, input: BrandInput): Promise<Brand> {
  const db = await requireDb();
  try {
    const [row] = await db
      .update(brands)
      .set({ ...input, sortOrder: input.sortOrder ?? undefined, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    if (!row) throw new BrandsDbError("NOT_FOUND", "Marca não encontrada.");
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function setBrandStatus(id: number, status: BrandStatus): Promise<Brand> {
  const db = await requireDb();
  const now = new Date();
  try {
    const [row] = await db
      .update(brands)
      .set({
        status,
        updatedAt: now,
        ...(status === "published" ? { publishedAt: now, archivedAt: null } : {}),
        ...(status === "archived" ? { archivedAt: now } : {}),
        ...(status === "draft" ? { archivedAt: null } : {}),
      })
      .where(eq(brands.id, id))
      .returning();
    if (!row) throw new BrandsDbError("NOT_FOUND", "Marca não encontrada.");
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function getProductRow(id: number): Promise<BrandProduct | undefined> {
  const db = await requireDb();
  try {
    const [row] = await db.select().from(brandProducts).where(eq(brandProducts.id, id)).limit(1);
    return row;
  } catch (error) {
    return translate(error);
  }
}

export type ProductInput = {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrls: string[];
  usageGuidelines: string | null;
  approvedInfo: string | null;
  referenceMaterials: { label: string; url: string }[];
  sortOrder?: number;
};

export async function createProduct(brandId: number, input: ProductInput): Promise<BrandProduct> {
  const db = await requireDb();
  try {
    const [row] = await db
      .insert(brandProducts)
      .values({ ...input, brandId, sortOrder: input.sortOrder ?? 0, status: "draft" })
      .returning();
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function updateProduct(id: number, input: ProductInput): Promise<BrandProduct> {
  const db = await requireDb();
  try {
    const [row] = await db
      .update(brandProducts)
      .set({ ...input, sortOrder: input.sortOrder ?? undefined, updatedAt: new Date() })
      .where(eq(brandProducts.id, id))
      .returning();
    if (!row) throw new BrandsDbError("NOT_FOUND", "Produto não encontrado.");
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function setProductStatus(id: number, status: BrandStatus): Promise<BrandProduct> {
  const db = await requireDb();
  const now = new Date();
  try {
    const [row] = await db
      .update(brandProducts)
      .set({
        status,
        updatedAt: now,
        ...(status === "published" ? { publishedAt: now, archivedAt: null } : {}),
        ...(status === "archived" ? { archivedAt: now } : {}),
        ...(status === "draft" ? { archivedAt: null } : {}),
      })
      .where(eq(brandProducts.id, id))
      .returning();
    if (!row) throw new BrandsDbError("NOT_FOUND", "Produto não encontrado.");
    return row;
  } catch (error) {
    return translate(error);
  }
}

export type OfferInput = {
  channel: string;
  label: string | null;
  url: string;
  notes: string | null;
  isActive: boolean;
  sortOrder?: number;
};

export async function saveOffer(
  brandProductId: number,
  input: OfferInput,
  offerId?: number
): Promise<BrandProductOffer> {
  const db = await requireDb();
  try {
    if (offerId) {
      const [row] = await db
        .update(brandProductOffers)
        .set({ ...input, sortOrder: input.sortOrder ?? undefined, updatedAt: new Date() })
        .where(and(eq(brandProductOffers.id, offerId), eq(brandProductOffers.brandProductId, brandProductId)))
        .returning();
      if (!row) throw new BrandsDbError("NOT_FOUND", "Oferta não encontrada.");
      return row;
    }
    const [row] = await db
      .insert(brandProductOffers)
      .values({ ...input, brandProductId, sortOrder: input.sortOrder ?? 0 })
      .returning();
    return row;
  } catch (error) {
    return translate(error);
  }
}

export async function deleteOffer(offerId: number): Promise<boolean> {
  const db = await requireDb();
  try {
    const rows = await db
      .delete(brandProductOffers)
      .where(eq(brandProductOffers.id, offerId))
      .returning({ id: brandProductOffers.id });
    return rows.length > 0;
  } catch (error) {
    return translate(error);
  }
}

// ---------------------------------------------------------------------------
// Preferências do creator (interesses e marcas de interesse)
// ---------------------------------------------------------------------------

export type UserPreferences = {
  interests: InterestKey[];
  /** Somente marcas publicadas: marcas arquivadas/rascunho não aparecem em novas seleções. */
  brandIds: number[];
  savedAt: Date | null;
};

export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  const empty: UserPreferences = { interests: [], brandIds: [], savedAt: null };
  const db = await getDb();
  if (!db) return empty;
  return safeRead(empty, async () => {
    const [interestRows, brandRows, pref] = await Promise.all([
      db.select({ interest: userInterests.interest }).from(userInterests).where(eq(userInterests.userId, userId)),
      db
        .select({ brandId: userBrandInterests.brandId })
        .from(userBrandInterests)
        .innerJoin(brands, eq(brands.id, userBrandInterests.brandId))
        .where(and(eq(userBrandInterests.userId, userId), eq(brands.status, "published"))),
      db.select().from(creatorPreferences).where(eq(creatorPreferences.userId, userId)).limit(1),
    ]);
    return {
      interests: interestRows.map(r => r.interest as InterestKey),
      brandIds: brandRows.map(r => r.brandId),
      savedAt: pref[0]?.interestsSavedAt ?? null,
    };
  });
}

/**
 * Substitui as preferências do usuário. Marcas ainda não publicadas são ignoradas
 * (não podem ser selecionadas); seleções antigas de marcas hoje arquivadas são preservadas.
 */
export async function saveUserPreferences(
  userId: number,
  interests: InterestKey[],
  brandIds: number[]
): Promise<UserPreferences> {
  const db = await requireDb();
  try {
    await db.transaction(async tx => {
      const published = brandIds.length
        ? await tx
            .select({ id: brands.id })
            .from(brands)
            .where(and(inArray(brands.id, brandIds), eq(brands.status, "published")))
        : [];
      const validBrandIds = published.map(b => b.id);

      await tx.delete(userInterests).where(eq(userInterests.userId, userId));
      if (interests.length) {
        await tx.insert(userInterests).values(interests.map(interest => ({ userId, interest })));
      }

      const allPublished = await tx.select({ id: brands.id }).from(brands).where(eq(brands.status, "published"));
      const publishedIds = allPublished.map(b => b.id);
      if (publishedIds.length) {
        await tx
          .delete(userBrandInterests)
          .where(and(eq(userBrandInterests.userId, userId), inArray(userBrandInterests.brandId, publishedIds)));
      }
      if (validBrandIds.length) {
        await tx.insert(userBrandInterests).values(validBrandIds.map(brandId => ({ userId, brandId })));
      }

      const now = new Date();
      await tx
        .insert(creatorPreferences)
        .values({ userId, interestsSavedAt: now, updatedAt: now })
        .onConflictDoUpdate({
          target: creatorPreferences.userId,
          set: { interestsSavedAt: now, updatedAt: now },
        });
    });
  } catch (error) {
    return translate(error);
  }
  return getUserPreferences(userId);
}

export async function countPublishedBrands(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  return safeRead(0, async () => {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(brands)
      .where(eq(brands.status, "published"));
    return row?.count ?? 0;
  });
}