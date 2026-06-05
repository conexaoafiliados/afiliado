export function formatGoalLabel(target: number): string {
  if (target >= 1000) return `${(target / 1000).toFixed(target % 1000 === 0 ? 0 : 1)}K`;
  return String(target);
}

export function getMilestonesForTarget(target: number, current: number) {
  let values: number[];
  if (target <= 2000) {
    values = [500, 1000, 2000];
  } else if (target <= 20000) {
    const prev = Math.max(2000, target - 5000);
    const mid = prev + Math.round((target - prev) / 2);
    values = [prev, mid, target];
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
