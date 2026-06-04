import { eq } from "drizzle-orm";
import { productOrders, products } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const ordersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: productOrders.id,
        productId: productOrders.productId,
        quantity: productOrders.quantity,
        totalPrice: productOrders.totalPrice,
        status: productOrders.status,
        createdAt: productOrders.createdAt,
        productTitle: products.title,
        productCategory: products.category,
      })
      .from(productOrders)
      .innerJoin(products, eq(productOrders.productId, products.id))
      .where(eq(productOrders.userId, ctx.user.id));
  }),
});
