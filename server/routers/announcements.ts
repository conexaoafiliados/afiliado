import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAnnouncement,
  createAnnouncementComment,
  getAnnouncementComments,
  getAnnouncementsFeed,
  toggleAnnouncementLike,
} from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

export const announcementsRouter = router({
  feed: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          channel: z.enum(["avisos", "punicoes"]).default("avisos"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      getAnnouncementsFeed(
        ctx.user.id,
        input?.limit ?? 50,
        input?.offset ?? 0,
        input?.channel ?? "avisos"
      )
    ),

  post: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        content: z.string().min(1).max(10000),
        imageUrl: z.string().url().optional().or(z.literal("")),
        attachmentUrl: z.string().url().optional().or(z.literal("")),
        attachmentName: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createAnnouncement(ctx.user.id, {
        title: input.title.trim(),
        content: input.content.trim(),
        imageUrl: input.imageUrl || undefined,
        attachmentUrl: input.attachmentUrl || undefined,
        attachmentName: input.attachmentName,
      });
      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível publicar o aviso" });
      }
      return { success: true, id };
    }),

  like: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .mutation(async ({ ctx, input }) => toggleAnnouncementLike(ctx.user.id, input.announcementId)),

  comments: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .query(async ({ input }) => getAnnouncementComments(input.announcementId)),

  comment: protectedProcedure
    .input(
      z.object({
        announcementId: z.number(),
        content: z.string().min(1).max(2000),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createAnnouncementComment(
        ctx.user.id,
        input.announcementId,
        input.content,
        input.parentCommentId
      );
      if (!id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: input.parentCommentId ? "Comentário não encontrado" : "Aviso não encontrado",
        });
      }
      return { success: true, id };
    }),
});
