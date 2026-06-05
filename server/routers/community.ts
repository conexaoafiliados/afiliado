import { z } from "zod";
import {
  createCommunityPost,
  createPostComment,
  getCommunityFeed,
  getGroupMembers,
  getPostComments,
  togglePostLike,
} from "../db";
import { uploadImage } from "../_core/storage";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";

const channelSchema = z.enum(["feed", "grupo-aberto"]);

const postInputSchema = z
  .object({
    content: z.string().max(5000),
    channel: channelSchema.default("feed"),
    imageUrl: z.string().url().optional().or(z.literal("")),
    imageBase64: z.string().optional(),
    imageMime: z.string().optional(),
  })
  .refine(data => data.content.trim().length > 0 || data.imageUrl || data.imageBase64, {
    message: "Escreva uma mensagem ou anexe uma imagem",
  });

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
    .input(postInputSchema)
    .mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl || undefined;

      if (input.imageBase64) {
        const uploaded = await uploadImage(
          "community-posts",
          `${ctx.user.id}/${Date.now()}`,
          input.imageBase64,
          input.imageMime
        );
        if (!uploaded) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível enviar a imagem. Tente novamente.",
          });
        }
        imageUrl = uploaded;
      }

      const id = await createCommunityPost(ctx.user.id, input.content.trim(), {
        channel: input.channel,
        imageUrl,
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
