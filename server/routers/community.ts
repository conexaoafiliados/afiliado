import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCommunityPost,
  createPostComment,
  getCommunityFeed,
  getPostComments,
  togglePostLike,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const communityRouter = router({
  feed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
    .query(async ({ ctx, input }) => getCommunityFeed(ctx.user.id, input.limit, input.offset)),

  post: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const id = await createCommunityPost(ctx.user.id, input.content);
      if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível publicar" });
      return { success: true, id };
    }),

  like: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => togglePostLike(ctx.user.id, input.postId)),

  comments: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => getPostComments(input.postId)),

  comment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const id = await createPostComment(ctx.user.id, input.postId, input.content);
      if (!id) throw new TRPCError({ code: "NOT_FOUND", message: "Post não encontrado" });
      return { success: true, id };
    }),
});
