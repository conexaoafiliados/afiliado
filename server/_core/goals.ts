/** Sequência: 2K → 5K → 10K → +10K (20K, 30K…) */
export function getNextTarget(completedTarget: number): number {
  if (completedTarget < 2000) return 2000;
  if (completedTarget === 2000) return 5000;
  if (completedTarget === 5000) return 10000;
  return completedTarget + 10000;
}

export function resolveFollowerGoal(currentTarget: number, followers: number) {
  let target = currentTarget > 0 ? currentTarget : 2000;
  let goalCompleted = false;
  const completedTarget = target;

  while (followers >= target) {
    goalCompleted = true;
    target = getNextTarget(target);
  }

  const progressPercentage = Math.min(100, (followers / target) * 100);
  return { targetFollowers: target, progressPercentage, goalCompleted, completedTarget };
}

export function formatGoalLabel(target: number): string {
  if (target >= 1000) return `${(target / 1000).toFixed(target % 1000 === 0 ? 0 : 1)}K`;
  return String(target);
}

export function getMilestonesForTarget(target: number, current: number) {
  let values: number[];
  if (target <= 2000) {
    values = [500, 1000, 2000];
  } else if (target === 5000) {
    values = [2000, 3500, 5000];
  } else if (target === 10000) {
    values = [5000, 7500, 10000];
  } else {
    const prev = target - 10000;
    values = [prev, prev + 5000, target];
  }
  return values.map(value => ({
    label: formatGoalLabel(value),
    value,
    done: current >= value,
  }));
}
