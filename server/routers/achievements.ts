import { followerThresholdForTitle } from "../_core/achievementRules";
import {
  getAllAchievements,
  getFollowerProgress,
  getUserAchievements,
  syncFollowerAchievements,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const achievementsRouter = router({
  catalog: publicProcedure.query(async () => getAllAchievements()),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const progress = await getFollowerProgress(ctx.user.id);
    const followers = progress?.currentFollowers ?? 0;
    const { newlyUnlocked } = await syncFollowerAchievements(ctx.user.id, followers);

    const all = await getAllAchievements();
    const unlocked = await getUserAchievements(ctx.user.id);
    const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u.unlockedAt]));

    const items = all.map(a => {
      const followerThreshold = followerThresholdForTitle(a.title);
      return {
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id) ?? null,
        followerThreshold,
        isFollowerMilestone: followerThreshold !== null,
      };
    });

    items.sort((a, b) => {
      if (a.isFollowerMilestone && b.isFollowerMilestone) {
        return (a.followerThreshold ?? 0) - (b.followerThreshold ?? 0);
      }
      if (a.isFollowerMilestone) return -1;
      if (b.isFollowerMilestone) return 1;
      return a.title.localeCompare(b.title);
    });

    const unlockedFollowerTitles = items
      .filter(i => i.isFollowerMilestone && i.unlocked)
      .map(i => i.title);

    return {
      items,
      newlyUnlocked,
      unlockedFollowerTitles,
      currentFollowers: followers,
    };
  }),
});
