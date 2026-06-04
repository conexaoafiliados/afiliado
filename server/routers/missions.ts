import { z } from "zod";
import { createUserMission, getAllMissions, getMissionsByUserId } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const missionsRouter = router({
  catalog: publicProcedure.query(async () => getAllMissions()),

  list: protectedProcedure.query(async ({ ctx }) => getMissionsByUserId(ctx.user.id)),

  /** Catálogo + status do usuário (para a UI de missões) */
  feed: protectedProcedure.query(async ({ ctx }) => {
    const catalog = await getAllMissions();
    const mine = await getMissionsByUserId(ctx.user.id);
    return catalog.map(m => {
      const row = mine.find(u => u.missionId === m.id);
      return {
        ...m,
        status: (row?.status ?? "pending") as "pending" | "in_progress" | "completed",
        pointsEarned: row?.pointsEarned ?? 0,
      };
    });
  }),

  accept: protectedProcedure
    .input(z.object({ missionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await createUserMission(ctx.user.id, input.missionId);
      return { success: true };
    }),
});
