import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADMIN_PERMISSIONS } from "../../shared/adminPermissions";
import { FIRST_STEP_LESSON_SLUGS } from "@shared/learning/firstStep";
import {
  createLessonComment,
  getLearningLesson,
  getLearningTrack,
  getLessonComments,
  getLessonEngagement,
  learningLessonExists,
  listLearningTracks,
  setLearningTrackBrand,
  toggleLessonLike,
} from "../db";
import { permissionProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

async function assertValidLessonSlug(lessonSlug: string) {
  if (FIRST_STEP_LESSON_SLUGS.has(lessonSlug)) return;
  const exists = await learningLessonExists(lessonSlug);
  if (!exists) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aula não encontrada" });
  }
}

export const learningRouter = router({
  /** Trilhas cadastradas (gerais ou por marca). Cursos legados permanecem em /courses. */
  listTracks: publicProcedure.query(async () => listLearningTracks()),

  track: protectedProcedure
    .input(z.object({ trackSlug: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      const track = await getLearningTrack(input.trackSlug);
      if (!track) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trilha não encontrada" });
      }
      return track;
    }),

  adminSetTrackBrand: permissionProcedure(ADMIN_PERMISSIONS.LEARNING_MANAGE)
    .input(
      z.object({
        slug: z.string().min(1).max(64),
        brandId: z.number().int().positive().nullish().transform(v => v ?? null),
        description: z.string().trim().max(2000).nullish().transform(v => (v ? v : null)),
      })
    )
    .mutation(async ({ input }) => {
      const row = await setLearningTrackBrand(input.slug, input.brandId, input.description);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Trilha não encontrada" });
      return row;
    }),

  lesson: protectedProcedure
    .input(z.object({ lessonSlug: z.string().min(1).max(128) }))
    .query(async ({ input }) => {
      const lesson = await getLearningLesson(input.lessonSlug);
      if (!lesson) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aula não encontrada" });
      }
      return lesson;
    }),

  engagement: protectedProcedure
    .input(z.object({ lessonSlug: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      await assertValidLessonSlug(input.lessonSlug);
      return getLessonEngagement(input.lessonSlug, ctx.user.id);
    }),

  like: protectedProcedure
    .input(z.object({ lessonSlug: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      await assertValidLessonSlug(input.lessonSlug);
      return toggleLessonLike(ctx.user.id, input.lessonSlug);
    }),

  comments: protectedProcedure
    .input(z.object({ lessonSlug: z.string().min(1).max(128) }))
    .query(async ({ input }) => {
      await assertValidLessonSlug(input.lessonSlug);
      return getLessonComments(input.lessonSlug);
    }),

  comment: protectedProcedure
    .input(
      z.object({
        lessonSlug: z.string().min(1).max(128),
        content: z.string().min(1).max(2000),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertValidLessonSlug(input.lessonSlug);
      const id = await createLessonComment(
        ctx.user.id,
        input.lessonSlug,
        input.content,
        input.parentCommentId
      );
      if (!id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: input.parentCommentId ? "Comentário não encontrado" : "Não foi possível comentar",
        });
      }
      return { success: true, id };
    }),
});
