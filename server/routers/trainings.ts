import { z } from "zod";
import { getTrainingEvents, toggleTrainingRegistration } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const trainingsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          upcomingOnly: z.boolean().default(true),
          category: z.enum(["all", "geral", "indicacao", "estrategia"]).default("all"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      getTrainingEvents(ctx.user.id, {
        upcomingOnly: input?.upcomingOnly ?? true,
        category: input?.category ?? "all",
      })
    ),

  register: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => toggleTrainingRegistration(ctx.user.id, input.eventId)),
});
