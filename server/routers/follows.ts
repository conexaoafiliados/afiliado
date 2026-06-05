import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  discoverCreators,
  getFollowStats,
  getFollowerCreators,
  getFollowingCreators,
  toggleUserFollow,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const followsRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => getFollowStats(ctx.user.id)),

  discover: protectedProcedure
    .input(
      z
        .object({
          query: z.string().max(50).optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      discoverCreators(ctx.user.id, {
        query: input?.query,
        limit: input?.limit ?? 20,
        offset: input?.offset ?? 0,
      })
    ),

  following: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => getFollowingCreators(ctx.user.id, input?.limit ?? 30)),

  followers: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => getFollowerCreators(ctx.user.id, input?.limit ?? 30)),

  toggle: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode seguir a si mesmo" });
      }
      const result = await toggleUserFollow(ctx.user.id, input.userId);
      return result;
    }),
});
