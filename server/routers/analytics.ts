import {
  buildFollowerChart,
  getCreatorProfile,
  getFollowerHistory,
  getFollowerProgress,
  getSocialStats,
  getUserCommunityAnalytics,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const analyticsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [progress, profile, history, community, social] = await Promise.all([
      getFollowerProgress(ctx.user.id),
      getCreatorProfile(ctx.user.id),
      getFollowerHistory(ctx.user.id, 30),
      getUserCommunityAnalytics(ctx.user.id),
      getSocialStats(ctx.user.id),
    ]);

    const current = progress?.currentFollowers ?? 0;
    const target = progress?.targetFollowers ?? 2000;
    const source = (progress?.source ?? "manual") as "manual" | "tiktok" | "instagram";
    const followerChart = buildFollowerChart(history, current, source);

    const firstFollowers = followerChart[0]?.followers ?? 0;
    const lastFollowers = followerChart[followerChart.length - 1]?.followers ?? current;
    const followerGrowth = lastFollowers - firstFollowers;
    const followerGrowthPct =
      firstFollowers > 0
        ? ((lastFollowers - firstFollowers) / firstFollowers) * 100
        : lastFollowers > 0
          ? 100
          : 0;

    return {
      journey: {
        current,
        target,
        remaining: Math.max(0, target - current),
        progressPercentage: progress?.progressPercentage
          ? parseFloat(String(progress.progressPercentage))
          : target > 0
            ? (current / target) * 100
            : 0,
        growth: followerGrowth,
        growthPct: followerGrowthPct,
        source,
      },
      followerChart,
      tiktok: {
        linked: Boolean(profile?.tiktokLinkedAt),
        handle: profile?.tiktokHandle ?? null,
        displayName: profile?.tiktokDisplayName ?? null,
        lastSyncAt: social.tiktok?.lastSyncAt ?? progress?.tiktokLastSyncAt ?? null,
        stats: social.tiktok,
      },
      instagram: {
        linked: Boolean(profile?.instagramLinkedAt),
        handle: profile?.instagramHandle ?? null,
        displayName: profile?.instagramDisplayName ?? null,
        lastSyncAt: social.instagram?.lastSyncAt ?? null,
        stats: social.instagram,
      },
      community,
    };
  }),
});
