import {
  getMonthlyHorizontalProgress,
  getQuarterlyVerticalProgress,
  suggestMonthlyTarget,
  getCurrentStreak,
  getStageForPoints,
} from '../src/challenges';
import { Interaction, MonthlyResult, Target } from '../src/types';

function makeInteraction(targetId: string, date: string, type: 'quick_touch' | 'real_conversation' | 'intentional_hangout' = 'intentional_hangout'): Interaction {
  return { id: `i-${targetId}-${date}`, targetId, type, points: 15, date };
}

// --- suggestMonthlyTarget ---

describe('suggestMonthlyTarget', () => {
  it('returns active count minus 1, minimum 1', () => {
    expect(suggestMonthlyTarget(4)).toBe(3);
    expect(suggestMonthlyTarget(3)).toBe(2);
    expect(suggestMonthlyTarget(1)).toBe(1);
    expect(suggestMonthlyTarget(0)).toBe(1);
  });
});

// --- getMonthlyHorizontalProgress ---

describe('getMonthlyHorizontalProgress', () => {
  it('returns 0 for no interactions', () => {
    const result = getMonthlyHorizontalProgress([], '2026-03');
    expect(result).toBe(0);
  });

  it('counts unique targetIds in the given month', () => {
    const interactions = [
      makeInteraction('t1', '2026-03-05T00:00:00.000Z'),
      makeInteraction('t1', '2026-03-10T00:00:00.000Z'), // same person
      makeInteraction('t2', '2026-03-15T00:00:00.000Z'),
      makeInteraction('t3', '2026-02-28T00:00:00.000Z'), // wrong month
    ];
    expect(getMonthlyHorizontalProgress(interactions, '2026-03')).toBe(2);
  });
});

// --- getQuarterlyVerticalProgress ---

describe('getQuarterlyVerticalProgress', () => {
  it('returns 0 for no interactions with a target in the quarter', () => {
    expect(getQuarterlyVerticalProgress([], 't1', '2026-Q1')).toBe(0);
  });

  it('counts interactions with a specific target in Q1 (Jan-Mar)', () => {
    const interactions = [
      makeInteraction('t1', '2026-01-15T00:00:00.000Z'),
      makeInteraction('t1', '2026-03-10T00:00:00.000Z'),
      makeInteraction('t1', '2026-04-01T00:00:00.000Z'), // Q2
      makeInteraction('t2', '2026-02-01T00:00:00.000Z'), // wrong target
    ];
    expect(getQuarterlyVerticalProgress(interactions, 't1', '2026-Q1')).toBe(2);
  });

  it('counts interactions in Q2 (Apr-Jun)', () => {
    const interactions = [
      makeInteraction('t1', '2026-04-15T00:00:00.000Z'),
      makeInteraction('t1', '2026-06-30T00:00:00.000Z'),
    ];
    expect(getQuarterlyVerticalProgress(interactions, 't1', '2026-Q2')).toBe(2);
  });
});

// --- getCurrentStreak ---

describe('getCurrentStreak', () => {
  it('returns 0 for no results', () => {
    expect(getCurrentStreak([])).toBe(0);
  });

  it('counts consecutive hit months from most recent', () => {
    const results: MonthlyResult[] = [
      { month: '2026-01', target: 3, actual: 3, hit: true },
      { month: '2026-02', target: 3, actual: 3, hit: true },
      { month: '2026-03', target: 3, actual: 2, hit: false },
    ];
    expect(getCurrentStreak(results)).toBe(0);
  });

  it('counts from most recent hit backwards', () => {
    const results: MonthlyResult[] = [
      { month: '2025-12', target: 3, actual: 1, hit: false },
      { month: '2026-01', target: 3, actual: 3, hit: true },
      { month: '2026-02', target: 3, actual: 3, hit: true },
    ];
    expect(getCurrentStreak(results)).toBe(2);
  });
});

// --- getStageForPoints ---

describe('getStageForPoints', () => {
  it('returns acquaintance for 0 points', () => {
    expect(getStageForPoints(0)).toBe('acquaintance');
  });

  it('returns acquaintance for 24 points', () => {
    expect(getStageForPoints(24)).toBe('acquaintance');
  });

  it('returns building for 25 points', () => {
    expect(getStageForPoints(25)).toBe('building');
  });

  it('returns building for 149 points', () => {
    expect(getStageForPoints(149)).toBe('building');
  });

  it('returns bro for 150 points', () => {
    expect(getStageForPoints(150)).toBe('bro');
  });

  it('returns bro for 999 points', () => {
    expect(getStageForPoints(999)).toBe('bro');
  });
});
