jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTargets,
  saveTarget,
  deleteTarget,
  getInteractions,
  saveInteraction,
  getChallenges,
  saveChallenge,
  getMonthlyResults,
  saveMonthlyResult,
} from '../src/storage';
import { Target, Interaction, Challenge, MonthlyResult } from '../src/types';

beforeEach(() => {
  (AsyncStorage.clear as jest.Mock)();
});

// --- Targets ---

describe('targets', () => {
  const target: Target = {
    id: 't1',
    name: 'Jake Kowalski',
    notes: 'Kids in same class',
    stage: 'acquaintance',
    status: 'bench',
    totalPoints: 0,
    createdAt: '2026-03-01T00:00:00.000Z',
  };

  it('returns empty array when no targets exist', async () => {
    expect(await getTargets()).toEqual([]);
  });

  it('saves and retrieves a target', async () => {
    await saveTarget(target);
    const targets = await getTargets();
    expect(targets).toHaveLength(1);
    expect(targets[0].name).toBe('Jake Kowalski');
  });

  it('updates an existing target by id', async () => {
    await saveTarget(target);
    await saveTarget({ ...target, stage: 'building', totalPoints: 30 });
    const targets = await getTargets();
    expect(targets).toHaveLength(1);
    expect(targets[0].stage).toBe('building');
    expect(targets[0].totalPoints).toBe(30);
  });

  it('deletes a target by id', async () => {
    await saveTarget(target);
    await deleteTarget('t1');
    expect(await getTargets()).toEqual([]);
  });
});

// --- Interactions ---

describe('interactions', () => {
  const interaction: Interaction = {
    id: 'i1',
    targetId: 't1',
    type: 'real_conversation',
    points: 5,
    note: 'Talked at practice',
    date: '2026-03-15T00:00:00.000Z',
  };

  it('returns empty array when no interactions exist', async () => {
    expect(await getInteractions()).toEqual([]);
  });

  it('saves and retrieves an interaction', async () => {
    await saveInteraction(interaction);
    const interactions = await getInteractions();
    expect(interactions).toHaveLength(1);
    expect(interactions[0].type).toBe('real_conversation');
  });

  it('retrieves interactions filtered by targetId', async () => {
    await saveInteraction(interaction);
    await saveInteraction({ ...interaction, id: 'i2', targetId: 't2' });
    const filtered = await getInteractions('t1');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].targetId).toBe('t1');
  });
});

// --- Challenges ---

describe('challenges', () => {
  const challenge: Challenge = {
    id: 'c1',
    type: 'monthly_horizontal',
    targetCount: 3,
    periodStart: '2026-03-01T00:00:00.000Z',
    periodEnd: '2026-03-31T23:59:59.999Z',
  };

  it('returns empty array when no challenges exist', async () => {
    expect(await getChallenges()).toEqual([]);
  });

  it('saves and retrieves a challenge', async () => {
    await saveChallenge(challenge);
    const challenges = await getChallenges();
    expect(challenges).toHaveLength(1);
    expect(challenges[0].type).toBe('monthly_horizontal');
  });
});

// --- Monthly Results ---

describe('monthly results', () => {
  const result: MonthlyResult = {
    month: '2026-02',
    target: 3,
    actual: 3,
    hit: true,
  };

  it('returns empty array when no results exist', async () => {
    expect(await getMonthlyResults()).toEqual([]);
  });

  it('saves and retrieves a monthly result', async () => {
    await saveMonthlyResult(result);
    const results = await getMonthlyResults();
    expect(results).toHaveLength(1);
    expect(results[0].hit).toBe(true);
  });
});
