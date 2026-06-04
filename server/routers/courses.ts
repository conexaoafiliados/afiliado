import { z } from "zod";
import { enrollCourse, getAllCourses, getCoursesByUserId } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const coursesRouter = router({
  list: publicProcedure.query(async () => getAllCourses()),

  myList: protectedProcedure.query(async ({ ctx }) => getCoursesByUserId(ctx.user.id)),

  enroll: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await enrollCourse(ctx.user.id, input.courseId);
      return { success: true };
    }),
});
