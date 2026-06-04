import { z } from "zod";
import { createProduct, getAllProducts, getProductsByUserId } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const shopRouter = router({
  list: publicProcedure.query(async () => getAllProducts()),

  myList: protectedProcedure.query(async ({ ctx }) => getProductsByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        category: z.enum(["digital", "physical"]),
        price: z.number().min(0),
        stock: z.number().min(0).optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createProduct(ctx.user.id, input);
      return { success: true };
    }),
});
