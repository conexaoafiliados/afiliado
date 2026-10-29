import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  brandProducts,
  brands,
  campaignApplications,
  campaignDeliveries,
  campaignProducts,
  campaigns,
  users,
  type Campaign,
  type CampaignApplication,
  type CampaignDelivery,
  type CampaignSampleAddress,
} from "../drizzle/schema";
import type {
  ApplicationStatus,
  CampaignStatus,
  DeliveryStatus,
  SampleAddress,
} from "../shared/campaigns";
import {
  canApplyToCampaign,
  canReviewApplication,
  canReviewDelivery,
  canSubmitDelivery,
  canTransitionCampaignStatus,
  getCampaignPublishIssues,
  validateSampleAddress,
} from "../shared/campaigns";
import { getDb } from "./db";

export type CampaignsDbErrorCode =
  | "SLUG_TAKEN"
  | "NOT_FOUND"
  | "MIGRATION_PENDING"
  | "NO_DATABASE"
  | "INVALID_TRANSITION"
  | "INVALID_PRODUCTS"
  | "DUPLICATE_APPLICATION"
  | "NOT_ALLOWED"
  | "VALIDATION";

export class CampaignsDbError extends Error {
  constructor(
    public readonly code: CampaignsDbErrorCode,
    message: string
  ) {
    super(message);
    this.name = "CampaignsDbError";
  }
}

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

function translate(error: unknown): never {
  const code = pgCode(error);
  if (code === "23505") {
    throw new CampaignsDbError("SLUG_TAKEN", "Este identificador de URL ou candidatura já existe.");
  }
  if (code === "42P01") {
    throw new CampaignsDbError(
      "MIGRATION_PENDING",
      "As tabelas de campanhas ainda não existem. Aplique supabase/migration_movimento_etapa2_campanhas.sql."
    );
  }
  throw error;
}

let warnedMissing = false;

async function safeRead<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (pgCode(error) === "42P01") {
      if (!warnedMissing) {
        warnedMissing = true;
        console.warn("[Campaigns] tabelas ausentes — aplique migration_movimento_etapa2_campanhas.sql");
      }
      return fallback;
    }
    throw error;
  }
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new CampaignsDbError("NO_DATABASE", "Banco de dados indisponível.");
  return db;
}

export type PublicCampaignListItem = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: CampaignStatus;
  brandId: number;
  brandName: string;
  brandSlug: string;
  brandAccentColor: string | null;
  brandLogoUrl: string | null;
  applicationOpensAt: Date | null;
  applicationClosesAt: Date | null;
  deliveryDeadline: Date | null;
  productIds: number[];
  productNames: string[];
  acceptingApplications: boolean;
};

export type PublicCampaignDetail = PublicCampaignListItem & {
  briefing: string | null;
  participationCriteria: string | null;
  expectedDeliverables: string | null;
  contentFormats: string[];
  sampleConditions: string | null;
  commissionConditions: string | null;
  compensationConditions: string | null;
  requiresSampleAddress: boolean;
  requiresRepostAuth: boolean;
  requiresAdUsageAuth: boolean;
  products: { id: number; slug: string; name: string; category: string | null }[];
};

type CampaignWritable = {
  brandId: number;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  briefing: string | null;
  participationCriteria: string | null;
  expectedDeliverables: string | null;
  contentFormats: string[];
  applicationOpensAt: Date | null;
  applicationClosesAt: Date | null;
  deliveryDeadline: Date | null;
  sampleConditions: string | null;
  commissionConditions: string | null;
  compensationConditions: string | null;
  requiresSampleAddress: boolean;
  requiresRepostAuth: boolean;
  requiresAdUsageAuth: boolean;
};

function acceptingFlag(c: Pick<Campaign, "status" | "applicationOpensAt" | "applicationClosesAt">): boolean {
  return canApplyToCampaign({
    status: c.status as CampaignStatus,
    applicationOpensAt: c.applicationOpensAt,
    applicationClosesAt: c.applicationClosesAt,
  }).ok;
}

async function loadProductMaps(campaignIds: number[]) {
  if (!campaignIds.length) {
    return {
      idsByCampaign: new Map<number, number[]>(),
      namesByCampaign: new Map<number, string[]>(),
      productsByCampaign: new Map<number, { id: number; slug: string; name: string; category: string | null }[]>(),
    };
  }
  const db = await requireDb();
  const rows = await db
    .select({
      campaignId: campaignProducts.campaignId,
      id: brandProducts.id,
      slug: brandProducts.slug,
      name: brandProducts.name,
      category: brandProducts.category,
    })
    .from(campaignProducts)
    .innerJoin(brandProducts, eq(brandProducts.id, campaignProducts.brandProductId))
    .where(inArray(campaignProducts.campaignId, campaignIds));

  const idsByCampaign = new Map<number, number[]>();
  const namesByCampaign = new Map<number, string[]>();
  const productsByCampaign = new Map<
    number,
    { id: number; slug: string; name: string; category: string | null }[]
  >();
  for (const row of rows) {
    const ids = idsByCampaign.get(row.campaignId) ?? [];
    ids.push(row.id);
    idsByCampaign.set(row.campaignId, ids);
    const names = namesByCampaign.get(row.campaignId) ?? [];
    names.push(row.name);
    namesByCampaign.set(row.campaignId, names);
    const products = productsByCampaign.get(row.campaignId) ?? [];
    products.push({ id: row.id, slug: row.slug, name: row.name, category: row.category });
    productsByCampaign.set(row.campaignId, products);
  }
  return { idsByCampaign, namesByCampaign, productsByCampaign };
}

function toListItem(
  c: Campaign & { brandName: string; brandSlug: string; brandAccentColor: string | null; brandLogoUrl: string | null },
  productIds: number[],
  productNames: string[]
): PublicCampaignListItem {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    coverUrl: c.coverUrl,
    status: c.status as CampaignStatus,
    brandId: c.brandId,
    brandName: c.brandName,
    brandSlug: c.brandSlug,
    brandAccentColor: c.brandAccentColor,
    brandLogoUrl: c.brandLogoUrl,
    applicationOpensAt: c.applicationOpensAt,
    applicationClosesAt: c.applicationClosesAt,
    deliveryDeadline: c.deliveryDeadline,
    productIds,
    productNames,
    acceptingApplications: acceptingFlag(c),
  };
}

async function assertProductsBelongToBrand(brandId: number, productIds: number[]) {
  if (!productIds.length) return;
  const db = await requireDb();
  const rows = await db
    .select({ id: brandProducts.id, brandId: brandProducts.brandId, status: brandProducts.status })
    .from(brandProducts)
    .where(inArray(brandProducts.id, productIds));
  if (rows.length !== productIds.length) {
    throw new CampaignsDbError("INVALID_PRODUCTS", "Um ou mais produtos não foram encontrados.");
  }
  for (const row of rows) {
    if (row.brandId !== brandId) {
      throw new CampaignsDbError("INVALID_PRODUCTS", "Todos os produtos devem pertencer à marca da campanha.");
    }
    if (row.status === "archived") {
      throw new CampaignsDbError("INVALID_PRODUCTS", "Não é possível vincular produtos arquivados a novas campanhas.");
    }
  }
}

async function replaceCampaignProducts(campaignId: number, productIds: number[]) {
  const db = await requireDb();
  await db.delete(campaignProducts).where(eq(campaignProducts.campaignId, campaignId));
  if (!productIds.length) return;
  await db.insert(campaignProducts).values(
    productIds.map(brandProductId => ({
      campaignId,
      brandProductId,
    }))
  );
}

/** Marcas e produtos selecionáveis no admin de campanhas (não exige brands.manage). */
export async function listBrandOptionsForCampaigns() {
  const db = await requireDb();
  try {
    const brandRows = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        status: brands.status,
      })
      .from(brands)
      .where(inArray(brands.status, ["draft", "published"]))
      .orderBy(asc(brands.sortOrder), asc(brands.name));

    const brandIds = brandRows.map(b => b.id);
    const productRows =
      brandIds.length === 0
        ? []
        : await db
            .select({
              id: brandProducts.id,
              brandId: brandProducts.brandId,
              name: brandProducts.name,
              slug: brandProducts.slug,
              status: brandProducts.status,
            })
            .from(brandProducts)
            .where(and(inArray(brandProducts.brandId, brandIds), inArray(brandProducts.status, ["draft", "published"])))
            .orderBy(asc(brandProducts.sortOrder), asc(brandProducts.name));

    return brandRows.map(b => ({
      ...b,
      products: productRows.filter(p => p.brandId === b.id),
    }));
  } catch (error) {
    return translate(error);
  }
}

export async function countOpenCampaigns(): Promise<number> {
  return safeRead(0, async () => {
    const db = await requireDb();
    const now = new Date();
    const rows = await db
      .select({ id: campaigns.id, applicationOpensAt: campaigns.applicationOpensAt, applicationClosesAt: campaigns.applicationClosesAt, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.status, "published"));
    return rows.filter(r =>
      canApplyToCampaign({
        status: r.status as CampaignStatus,
        applicationOpensAt: r.applicationOpensAt,
        applicationClosesAt: r.applicationClosesAt,
        now,
      }).ok
    ).length;
  });
}

export async function listVisibleCampaigns(filters?: {
  brandId?: number;
  brandProductId?: number;
  includeClosed?: boolean;
}): Promise<PublicCampaignListItem[]> {
  return safeRead([], async () => {
    const db = await requireDb();
    const statuses: CampaignStatus[] = filters?.includeClosed === false ? ["published"] : ["published", "closed"];

    let campaignIdFilter: number[] | null = null;
    if (filters?.brandProductId) {
      const links = await db
        .select({ campaignId: campaignProducts.campaignId })
        .from(campaignProducts)
        .where(eq(campaignProducts.brandProductId, filters.brandProductId));
      campaignIdFilter = links.map(l => l.campaignId);
      if (!campaignIdFilter.length) return [];
    }

    const rows = await db
      .select({
        campaign: campaigns,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandAccentColor: brands.accentColor,
        brandLogoUrl: brands.logoUrl,
      })
      .from(campaigns)
      .innerJoin(brands, eq(brands.id, campaigns.brandId))
      .where(
        and(
          inArray(campaigns.status, statuses),
          filters?.brandId ? eq(campaigns.brandId, filters.brandId) : undefined,
          campaignIdFilter ? inArray(campaigns.id, campaignIdFilter) : undefined,
          eq(brands.status, "published")
        )
      )
      .orderBy(desc(campaigns.publishedAt), desc(campaigns.createdAt));

    const ids = rows.map(r => r.campaign.id);
    const maps = await loadProductMaps(ids);

    return rows.map(r =>
      toListItem(
        {
          ...r.campaign,
          brandName: r.brandName,
          brandSlug: r.brandSlug,
          brandAccentColor: r.brandAccentColor,
          brandLogoUrl: r.brandLogoUrl,
        },
        maps.idsByCampaign.get(r.campaign.id) ?? [],
        maps.namesByCampaign.get(r.campaign.id) ?? []
      )
    );
  });
}

export async function getVisibleCampaignBySlug(slug: string): Promise<PublicCampaignDetail | null> {
  return safeRead(null, async () => {
    const db = await requireDb();
    const rows = await db
      .select({
        campaign: campaigns,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandAccentColor: brands.accentColor,
        brandLogoUrl: brands.logoUrl,
      })
      .from(campaigns)
      .innerJoin(brands, eq(brands.id, campaigns.brandId))
      .where(and(eq(campaigns.slug, slug), inArray(campaigns.status, ["published", "closed"]), eq(brands.status, "published")))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const maps = await loadProductMaps([row.campaign.id]);
    const list = toListItem(
      {
        ...row.campaign,
        brandName: row.brandName,
        brandSlug: row.brandSlug,
        brandAccentColor: row.brandAccentColor,
        brandLogoUrl: row.brandLogoUrl,
      },
      maps.idsByCampaign.get(row.campaign.id) ?? [],
      maps.namesByCampaign.get(row.campaign.id) ?? []
    );
    return {
      ...list,
      briefing: row.campaign.briefing,
      participationCriteria: row.campaign.participationCriteria,
      expectedDeliverables: row.campaign.expectedDeliverables,
      contentFormats: row.campaign.contentFormats ?? [],
      sampleConditions: row.campaign.sampleConditions,
      commissionConditions: row.campaign.commissionConditions,
      compensationConditions: row.campaign.compensationConditions,
      requiresSampleAddress: row.campaign.requiresSampleAddress,
      requiresRepostAuth: row.campaign.requiresRepostAuth,
      requiresAdUsageAuth: row.campaign.requiresAdUsageAuth,
      products: maps.productsByCampaign.get(row.campaign.id) ?? [],
    };
  });
}

export async function getCampaignRow(id: number): Promise<Campaign | null> {
  const db = await requireDb();
  try {
    const rows = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    return translate(error);
  }
}

export async function adminListCampaigns() {
  const db = await requireDb();
  try {
    const rows = await db
      .select({
        campaign: campaigns,
        brandName: brands.name,
        brandSlug: brands.slug,
      })
      .from(campaigns)
      .innerJoin(brands, eq(brands.id, campaigns.brandId))
      .orderBy(desc(campaigns.updatedAt));

    const ids = rows.map(r => r.campaign.id);
    const maps = await loadProductMaps(ids);

    const appCounts =
      ids.length === 0
        ? []
        : await db
            .select({
              campaignId: campaignApplications.campaignId,
              status: campaignApplications.status,
              count: sql<number>`count(*)::int`,
            })
            .from(campaignApplications)
            .where(inArray(campaignApplications.campaignId, ids))
            .groupBy(campaignApplications.campaignId, campaignApplications.status);

    const countMap = new Map<number, { pending: number; approved: number; rejected: number; total: number }>();
    for (const id of ids) countMap.set(id, { pending: 0, approved: 0, rejected: 0, total: 0 });
    for (const row of appCounts) {
      const bucket = countMap.get(row.campaignId)!;
      const n = Number(row.count);
      bucket.total += n;
      if (row.status === "pending") bucket.pending += n;
      if (row.status === "approved") bucket.approved += n;
      if (row.status === "rejected") bucket.rejected += n;
    }

    return rows.map(r => ({
      ...r.campaign,
      brandName: r.brandName,
      brandSlug: r.brandSlug,
      productIds: maps.idsByCampaign.get(r.campaign.id) ?? [],
      productNames: maps.namesByCampaign.get(r.campaign.id) ?? [],
      applications: countMap.get(r.campaign.id)!,
    }));
  } catch (error) {
    return translate(error);
  }
}

export async function adminGetCampaign(id: number) {
  const db = await requireDb();
  try {
    const rows = await db
      .select({
        campaign: campaigns,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandStatus: brands.status,
      })
      .from(campaigns)
      .innerJoin(brands, eq(brands.id, campaigns.brandId))
      .where(eq(campaigns.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const maps = await loadProductMaps([id]);
    const brandProductRows = await db
      .select({
        id: brandProducts.id,
        slug: brandProducts.slug,
        name: brandProducts.name,
        status: brandProducts.status,
      })
      .from(brandProducts)
      .where(eq(brandProducts.brandId, row.campaign.brandId))
      .orderBy(asc(brandProducts.sortOrder), asc(brandProducts.name));

    return {
      campaign: row.campaign,
      brandName: row.brandName,
      brandSlug: row.brandSlug,
      brandStatus: row.brandStatus,
      productIds: maps.idsByCampaign.get(id) ?? [],
      products: maps.productsByCampaign.get(id) ?? [],
      brandProducts: brandProductRows,
    };
  } catch (error) {
    return translate(error);
  }
}

export async function createCampaign(values: CampaignWritable, productIds: number[], createdBy: number) {
  await assertProductsBelongToBrand(values.brandId, productIds);
  const db = await requireDb();
  try {
    const inserted = await db
      .insert(campaigns)
      .values({
        ...values,
        status: "draft",
        createdBy,
        updatedAt: new Date(),
      })
      .returning();
    const campaign = inserted[0]!;
    await replaceCampaignProducts(campaign.id, productIds);
    return campaign;
  } catch (error) {
    return translate(error);
  }
}

export async function updateCampaign(id: number, values: CampaignWritable, productIds: number[]) {
  const current = await getCampaignRow(id);
  if (!current) throw new CampaignsDbError("NOT_FOUND", "Campanha não encontrada.");
  await assertProductsBelongToBrand(values.brandId, productIds);

  if (current.status === "published") {
    const issues = getCampaignPublishIssues({
      ...values,
      productIds,
    });
    if (issues.length) {
      throw new CampaignsDbError("VALIDATION", `Campanha publicada não pode ficar incompleta: ${issues.join(" ")}`);
    }
  }

  const db = await requireDb();
  try {
    const updated = await db
      .update(campaigns)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    await replaceCampaignProducts(id, productIds);
    return updated[0]!;
  } catch (error) {
    return translate(error);
  }
}

export async function setCampaignStatus(id: number, status: CampaignStatus) {
  const current = await getCampaignRow(id);
  if (!current) throw new CampaignsDbError("NOT_FOUND", "Campanha não encontrada.");
  if (!canTransitionCampaignStatus(current.status as CampaignStatus, status)) {
    throw new CampaignsDbError("INVALID_TRANSITION", "Transição de status não permitida.");
  }

  if (status === "published") {
    const maps = await loadProductMaps([id]);
    const issues = getCampaignPublishIssues({
      title: current.title,
      briefing: current.briefing,
      brandId: current.brandId,
      productIds: maps.idsByCampaign.get(id) ?? [],
      applicationOpensAt: current.applicationOpensAt,
      applicationClosesAt: current.applicationClosesAt,
      deliveryDeadline: current.deliveryDeadline,
    });
    if (issues.length) {
      throw new CampaignsDbError("VALIDATION", `Para publicar: ${issues.join(" ")}`);
    }
    const brand = await (await requireDb())
      .select({ status: brands.status })
      .from(brands)
      .where(eq(brands.id, current.brandId))
      .limit(1);
    if (brand[0]?.status !== "published") {
      throw new CampaignsDbError("VALIDATION", "Publique a marca antes de publicar a campanha.");
    }
  }

  const db = await requireDb();
  const now = new Date();
  try {
    const updated = await db
      .update(campaigns)
      .set({
        status,
        publishedAt: status === "published" ? current.publishedAt ?? now : current.publishedAt,
        closedAt: status === "closed" ? now : status === "draft" ? null : current.closedAt,
        updatedAt: now,
      })
      .where(eq(campaigns.id, id))
      .returning();
    return updated[0]!;
  } catch (error) {
    return translate(error);
  }
}

export type MyApplicationView = {
  application: Omit<CampaignApplication, "sampleAddress"> & { hasSampleAddress: boolean };
  deliveries: CampaignDelivery[];
};

export async function getMyApplication(campaignId: number, userId: number): Promise<MyApplicationView | null> {
  return safeRead(null, async () => {
    const db = await requireDb();
    const apps = await db
      .select()
      .from(campaignApplications)
      .where(and(eq(campaignApplications.campaignId, campaignId), eq(campaignApplications.userId, userId)))
      .limit(1);
    const app = apps[0];
    if (!app) return null;
    const deliveries = await db
      .select()
      .from(campaignDeliveries)
      .where(eq(campaignDeliveries.applicationId, app.id))
      .orderBy(desc(campaignDeliveries.submittedAt));
    const { sampleAddress, ...rest } = app;
    return {
      application: { ...rest, hasSampleAddress: Boolean(sampleAddress) },
      deliveries,
    };
  });
}

export async function applyToCampaign(input: {
  campaignId: number;
  userId: number;
  message: string | null;
  sampleAddress: SampleAddress | null;
  allowRepost: boolean;
  allowAdUsage: boolean;
}) {
  const db = await requireDb();
  try {
    const rows = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
    const campaign = rows[0];
    if (!campaign || (campaign.status !== "published" && campaign.status !== "closed")) {
      // closed/draft não aceitam; draft nem deve ser visível
      throw new CampaignsDbError("NOT_FOUND", "Campanha não encontrada.");
    }
    const window = canApplyToCampaign({
      status: campaign.status as CampaignStatus,
      applicationOpensAt: campaign.applicationOpensAt,
      applicationClosesAt: campaign.applicationClosesAt,
    });
    if (!window.ok) throw new CampaignsDbError("NOT_ALLOWED", window.reason);

    if (campaign.requiresRepostAuth && !input.allowRepost) {
      throw new CampaignsDbError("VALIDATION", "Esta campanha exige autorização explícita de repost.");
    }
    if (campaign.requiresAdUsageAuth && !input.allowAdUsage) {
      throw new CampaignsDbError("VALIDATION", "Esta campanha exige autorização explícita de uso em anúncios.");
    }

    let address: CampaignSampleAddress | null = null;
    if (campaign.requiresSampleAddress) {
      const issues = validateSampleAddress(input.sampleAddress);
      if (issues.length) throw new CampaignsDbError("VALIDATION", issues.join(" "));
      address = input.sampleAddress as CampaignSampleAddress;
    }

    const existing = await db
      .select({ id: campaignApplications.id })
      .from(campaignApplications)
      .where(
        and(eq(campaignApplications.campaignId, input.campaignId), eq(campaignApplications.userId, input.userId))
      )
      .limit(1);
    if (existing[0]) {
      throw new CampaignsDbError("DUPLICATE_APPLICATION", "Você já se candidatou a esta campanha.");
    }

    const inserted = await db
      .insert(campaignApplications)
      .values({
        campaignId: input.campaignId,
        userId: input.userId,
        status: "pending",
        message: input.message,
        sampleAddress: address,
        allowRepost: campaign.requiresRepostAuth ? input.allowRepost : false,
        allowAdUsage: campaign.requiresAdUsageAuth ? input.allowAdUsage : false,
        updatedAt: new Date(),
      })
      .returning();
    const { sampleAddress, ...rest } = inserted[0]!;
    return { ...rest, hasSampleAddress: Boolean(sampleAddress) };
  } catch (error) {
    if (error instanceof CampaignsDbError) throw error;
    return translate(error);
  }
}

export async function submitDelivery(input: {
  campaignId: number;
  userId: number;
  contentUrl: string;
  note: string | null;
}) {
  const db = await requireDb();
  try {
    const campaignRows = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1);
    const campaign = campaignRows[0];
    if (!campaign || campaign.status === "draft") {
      throw new CampaignsDbError("NOT_FOUND", "Campanha não encontrada.");
    }

    const apps = await db
      .select()
      .from(campaignApplications)
      .where(and(eq(campaignApplications.campaignId, input.campaignId), eq(campaignApplications.userId, input.userId)))
      .limit(1);
    const app = apps[0];
    if (!app) throw new CampaignsDbError("NOT_ALLOWED", "Você não tem candidatura nesta campanha.");

    const deliveries = await db
      .select()
      .from(campaignDeliveries)
      .where(eq(campaignDeliveries.applicationId, app.id))
      .orderBy(desc(campaignDeliveries.submittedAt));
    const latest = deliveries[0] ?? null;

    const allowed = canSubmitDelivery({
      campaignStatus: campaign.status as CampaignStatus,
      applicationStatus: app.status as ApplicationStatus,
      latestDeliveryStatus: (latest?.status as DeliveryStatus | undefined) ?? null,
    });
    if (!allowed.ok) throw new CampaignsDbError("NOT_ALLOWED", allowed.reason);

    const attempt = (latest?.attempt ?? 0) + 1;
    const inserted = await db
      .insert(campaignDeliveries)
      .values({
        applicationId: app.id,
        contentUrl: input.contentUrl,
        note: input.note,
        status: "submitted",
        attempt,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return inserted[0]!;
  } catch (error) {
    if (error instanceof CampaignsDbError) throw error;
    return translate(error);
  }
}

export async function adminListApplications(campaignId: number) {
  const db = await requireDb();
  try {
    const rows = await db
      .select({
        application: campaignApplications,
        userName: users.name,
        userUsername: users.username,
        userEmail: users.email,
      })
      .from(campaignApplications)
      .innerJoin(users, eq(users.id, campaignApplications.userId))
      .where(eq(campaignApplications.campaignId, campaignId))
      .orderBy(asc(campaignApplications.createdAt));

    const appIds = rows.map(r => r.application.id);
    const deliveries =
      appIds.length === 0
        ? []
        : await db
            .select()
            .from(campaignDeliveries)
            .where(inArray(campaignDeliveries.applicationId, appIds))
            .orderBy(desc(campaignDeliveries.submittedAt));

    const deliveriesByApp = new Map<number, CampaignDelivery[]>();
    for (const d of deliveries) {
      const list = deliveriesByApp.get(d.applicationId) ?? [];
      list.push(d);
      deliveriesByApp.set(d.applicationId, list);
    }

    return rows.map(r => ({
      ...r.application,
      userName: r.userName,
      userUsername: r.userUsername,
      userEmail: r.userEmail,
      deliveries: deliveriesByApp.get(r.application.id) ?? [],
    }));
  } catch (error) {
    return translate(error);
  }
}

export async function reviewApplication(input: {
  applicationId: number;
  reviewerId: number;
  status: "approved" | "rejected";
  reviewNote: string | null;
}) {
  const db = await requireDb();
  try {
    const rows = await db
      .select()
      .from(campaignApplications)
      .where(eq(campaignApplications.id, input.applicationId))
      .limit(1);
    const app = rows[0];
    if (!app) throw new CampaignsDbError("NOT_FOUND", "Candidatura não encontrada.");
    if (!canReviewApplication(app.status as ApplicationStatus, input.status)) {
      throw new CampaignsDbError("INVALID_TRANSITION", "Só é possível revisar candidaturas em análise.");
    }
    const updated = await db
      .update(campaignApplications)
      .set({
        status: input.status,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
        reviewedBy: input.reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(campaignApplications.id, input.applicationId))
      .returning();
    return updated[0]!;
  } catch (error) {
    if (error instanceof CampaignsDbError) throw error;
    return translate(error);
  }
}

export async function reviewDelivery(input: {
  deliveryId: number;
  reviewerId: number;
  status: "approved" | "changes_requested";
  revisionNote: string | null;
}) {
  const db = await requireDb();
  try {
    const rows = await db.select().from(campaignDeliveries).where(eq(campaignDeliveries.id, input.deliveryId)).limit(1);
    const delivery = rows[0];
    if (!delivery) throw new CampaignsDbError("NOT_FOUND", "Entrega não encontrada.");
    if (!canReviewDelivery(delivery.status as DeliveryStatus, input.status)) {
      throw new CampaignsDbError("INVALID_TRANSITION", "Só é possível revisar entregas enviadas.");
    }
    if (input.status === "changes_requested" && !input.revisionNote?.trim()) {
      throw new CampaignsDbError("VALIDATION", "Informe o que precisa ser ajustado.");
    }
    const updated = await db
      .update(campaignDeliveries)
      .set({
        status: input.status,
        revisionNote: input.revisionNote,
        reviewedAt: new Date(),
        reviewedBy: input.reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(campaignDeliveries.id, input.deliveryId))
      .returning();
    return updated[0]!;
  } catch (error) {
    if (error instanceof CampaignsDbError) throw error;
    return translate(error);
  }
}

export async function countUserPendingCampaignActions(userId: number): Promise<{
  openCampaigns: number;
  myPending: number;
  myNeedsDelivery: number;
}> {
  return safeRead({ openCampaigns: 0, myPending: 0, myNeedsDelivery: 0 }, async () => {
    const openCampaigns = await countOpenCampaigns();
    const db = await requireDb();
    const apps = await db
      .select({
        id: campaignApplications.id,
        status: campaignApplications.status,
        campaignStatus: campaigns.status,
      })
      .from(campaignApplications)
      .innerJoin(campaigns, eq(campaigns.id, campaignApplications.campaignId))
      .where(eq(campaignApplications.userId, userId));

    const myPending = apps.filter(a => a.status === "pending").length;
    const approvedIds = apps.filter(a => a.status === "approved").map(a => a.id);
    let myNeedsDelivery = 0;
    if (approvedIds.length) {
      const deliveries = await db
        .select()
        .from(campaignDeliveries)
        .where(inArray(campaignDeliveries.applicationId, approvedIds))
        .orderBy(desc(campaignDeliveries.submittedAt));
      const latestByApp = new Map<number, CampaignDelivery>();
      for (const d of deliveries) {
        if (!latestByApp.has(d.applicationId)) latestByApp.set(d.applicationId, d);
      }
      for (const appId of approvedIds) {
        const latest = latestByApp.get(appId);
        if (!latest || latest.status === "changes_requested") myNeedsDelivery += 1;
      }
    }
    return { openCampaigns, myPending, myNeedsDelivery };
  });
}
