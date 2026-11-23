import { desc, eq } from "drizzle-orm";
import {
  affiliateMaterials,
  affiliatePointRules,
  affiliateProductPoints,
  brandProducts,
  brands,
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
