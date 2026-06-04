import { getAllAchievements, getUserAchievements } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const achievementsRouter = router({
  catalog: publicProcedure.query(async () => getAllAchievements()),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const all = await getAllAchievements();
    const unlocked = await getUserAchievements(ctx.user.id);
    const unlockedIds = new Set(unlocked.map(u => u.achievementId));
    return all.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: unlocked.find(u => u.achievementId === a.id)?.unlockedAt ?? null,
    }));
  }),
});
