import { eq, sql } from "drizzle-orm";
import { productOrders, products } from "../../drizzle/schema";
import { getCreatorProfile, getDb, getFollowerHistory, getFollowerProgress } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const analyticsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const progress = await getFollowerProgress(ctx.user.id);
    const profile = await getCreatorProfile(ctx.user.id);
    const history = await getFollowerHistory(ctx.user.id, 14);
    const db = await getDb();

    let sales = {
      totalOrders: 0,
      paidOrders: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      recentOrders: [] as Array<{
        id: number;
        productTitle: string;
        totalPrice: string;
        status: string;
        createdAt: Date;
      }>,
    };

    if (db) {
      try {
        const orders = await db
          .select({
            id: productOrders.id,
            totalPrice: productOrders.totalPrice,
            status: productOrders.status,
            createdAt: productOrders.createdAt,
            productTitle: products.title,
          })
          .from(productOrders)
          .innerJoin(products, eq(productOrders.productId, products.id))
          .where(eq(productOrders.userId, ctx.user.id))
          .orderBy(sql`${productOrders.createdAt} DESC`)
          .limit(20);

        sales.recentOrders = orders.map(o => ({
          id: o.id,
          productTitle: o.productTitle,
          totalPrice: String(o.totalPrice),
          status: o.status,
          createdAt: o.createdAt,
        }));

        for (const o of orders) {
          sales.totalOrders += 1;
          const price = parseFloat(String(o.totalPrice)) || 0;
          if (o.status === "paid" || o.status === "delivered" || o.status === "shipped") {
            sales.paidOrders += 1;
            sales.totalRevenue += price;
          } else if (o.status === "pending") {
            sales.pendingRevenue += price;
          }
        }
      } catch (e) {
        console.warn("[Analytics] orders query failed:", e);
      }
    }

    const followerChart = [...history]
      .reverse()
      .map(h => ({
        date: new Date(h.recordedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        followers: h.followers,
        source: h.source,
      }));

    const current = progress?.currentFollowers ?? 0;
    const target = progress?.targetFollowers ?? 2000;

    return {
      tiktok: {
        linked: Boolean(profile?.tiktokLinkedAt),
        handle: profile?.tiktokHandle ?? null,
        displayName: profile?.tiktokDisplayName ?? null,
        lastSyncAt: progress?.tiktokLastSyncAt ?? null,
        source: progress?.source ?? "manual",
      },
      followers: {
        current,
        target,
        remaining: Math.max(0, target - current),
        progressPercentage: progress?.progressPercentage
          ? parseFloat(String(progress.progressPercentage))
          : (current / target) * 100,
      },
      followerChart,
      sales,
    };
  }),
});
