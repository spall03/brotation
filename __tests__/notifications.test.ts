import { pickNudge } from '../src/notifications';
import { Target, Interaction } from '../src/types';

function makeTarget(id: string, name: string, status: 'active' | 'bench' = 'active'): Target {
  return { id, name, notes: '', stage: 'building', status, totalPoints: 30, createdAt: '2026-01-01T00:00:00.000Z' };
}

function makeInteraction(targetId: string, daysAgo: number): Interaction {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: `i-${targetId}`, targetId, type: 'quick_touch', points: 1, date: d.toISOString() };
}

describe('pickNudge', () => {
  it('returns null when no active targets', () => {
    expect(pickNudge([], [], 3, 2)).toBeNull();
  });

  it('nudges the most stale active target', () => {
    const targets = [makeTarget('t1', 'Jake'), makeTarget('t2', 'Marcus')];
    const interactions = [
      makeInteraction('t1', 3),
      makeInteraction('t2', 14),
    ];
    const nudge = pickNudge(targets, interactions, 3, 2);
    expect(nudge).toContain('Marcus');
  });

  it('nudges about monthly goal when behind', () => {
    const targets = [makeTarget('t1', 'Jake')];
    const interactions: Interaction[] = [];
    const nudge = pickNudge(targets, interactions, 3, 0);
    expect(nudge).toBeTruthy();
  });

  it('returns null when all targets are on track', () => {
    const targets = [makeTarget('t1', 'Jake')];
    const interactions = [makeInteraction('t1', 1)];
    const nudge = pickNudge(targets, interactions, 1, 1);
    expect(nudge).toBeNull();
  });
});
