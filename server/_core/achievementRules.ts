import { formatGoalLabel } from "./goals";

export type FollowerAchievementDef = {
  title: string;
  description: string;
  threshold: number;
};

/** Marcos de seguidores — alinhado às metas (2K → +5K até 20K → +10K). */
export const FOLLOWER_ACHIEVEMENTS: FollowerAchievementDef[] = [
  { title: "500 Seguidores", description: "Alcance 500 seguidores no TikTok", threshold: 500 },
  { title: "1K Club", description: "Chegue a 1.000 seguidores", threshold: 1000 },
  { title: "Creator 2K", description: "Meta: 2.000 seguidores", threshold: 2000 },
  { title: "Creator 5K", description: "Meta: 5.000 seguidores", threshold: 5000 },
  { title: "Creator 10K", description: "Meta: 10.000 seguidores", threshold: 10000 },
  { title: "Creator 15K", description: "Meta: 15.000 seguidores", threshold: 15000 },
  { title: "Creator 20K", description: "Meta: 20.000 seguidores", threshold: 20000 },
  { title: "Creator 30K", description: "Meta: 30.000 seguidores", threshold: 30000 },
  { title: "Creator 40K", description: "Meta: 40.000 seguidores", threshold: 40000 },
  { title: "Creator 50K", description: "Meta: 50.000 seguidores", threshold: 50000 },
];

export function followerThresholdForTitle(title: string): number | null {
  const found = FOLLOWER_ACHIEVEMENTS.find(a => a.title === title);
  return found?.threshold ?? null;
}

export function achievementCongratsLabel(threshold: number): string {
  return `${formatGoalLabel(threshold)} seguidores`;
}
