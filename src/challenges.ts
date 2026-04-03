import { Interaction, MonthlyResult, Stage } from './types';
import { STAGE_ORDER, STAGE_THRESHOLDS } from './constants';

export function suggestMonthlyTarget(activeCount: number): number {
  return Math.max(1, activeCount - 1);
}

export function getMonthlyHorizontalProgress(
  interactions: Interaction[],
  month: string, // "2026-03"
): number {
  const uniqueTargets = new Set<string>();
  for (const interaction of interactions) {
    const interactionMonth = interaction.date.slice(0, 7);
    if (interactionMonth === month) {
      uniqueTargets.add(interaction.targetId);
    }
  }
  return uniqueTargets.size;
}

function getQuarterMonths(quarter: string): string[] {
  // "2026-Q1" -> ["2026-01", "2026-02", "2026-03"]
  const [year, q] = quarter.split('-Q');
  const qNum = parseInt(q, 10);
  const startMonth = (qNum - 1) * 3 + 1;
  return [0, 1, 2].map((offset) => {
    const m = startMonth + offset;
    return `${year}-${String(m).padStart(2, '0')}`;
  });
}

export function getQuarterlyVerticalProgress(
  interactions: Interaction[],
  targetId: string,
  quarter: string, // "2026-Q1"
): number {
  const months = getQuarterMonths(quarter);
  return interactions.filter((i) => {
    const interactionMonth = i.date.slice(0, 7);
    return i.targetId === targetId && months.includes(interactionMonth);
  }).length;
}

export function getCurrentStreak(results: MonthlyResult[]): number {
  const sorted = [...results].sort((a, b) => b.month.localeCompare(a.month));
  let streak = 0;
  for (const result of sorted) {
    if (result.hit) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getStageForPoints(points: number): Stage {
  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    if (points >= STAGE_THRESHOLDS[STAGE_ORDER[i]]) {
      return STAGE_ORDER[i];
    }
  }
  return 'acquaintance';
}

export function getCurrentQuarter(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed
  const quarter = Math.floor(month / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

export function getCurrentMonth(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
