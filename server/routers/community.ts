import { z } from "zod";
import { createCommunityPost, getCommunityPosts, likePost } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const communityRouter = router({
  feed: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => getCommunityPosts(input.limit, input.offset)),

  post: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      await createCommunityPost(ctx.user.id, input.content);
      return { success: true };
    }),

  like: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await likePost(ctx.user.id, input.postId);
      return { success: true };
    }),
});
