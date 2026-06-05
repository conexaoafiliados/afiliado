import { z } from "zod";
import {
  createCommunityPost,
  createPostComment,
  getCommunityFeed,
  getGroupMembers,
  getPostComments,
  togglePostLike,
} from "../db";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";

const channelSchema = z.enum(["feed", "grupo-aberto"]);

export const communityRouter = router({
  feed: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          channel: channelSchema.default("feed"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      getCommunityFeed(
        ctx.user.id,
        input?.limit ?? 50,
        input?.offset ?? 0,
        input?.channel ?? "feed"
      )
    ),

  members: protectedProcedure.query(async ({ ctx }) => getGroupMembers(ctx.user.id)),

  post: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        channel: channelSchema.default("feed"),
        imageUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createCommunityPost(ctx.user.id, input.content, {
        channel: input.channel,
        imageUrl: input.imageUrl || undefined,
      });
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
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createPostComment(
        ctx.user.id,
        input.postId,
        input.content,
        input.parentCommentId
      );
      if (!id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: input.parentCommentId ? "Comentário não encontrado" : "Post não encontrado",
        });
      }
      return { success: true, id };
    }),
});
