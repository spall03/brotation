# Brotation v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new Expo app — a friendship-building challenge tracker that helps turn acquaintances into friends through gamified meetup targets and a relationship pipeline.

**Architecture:** Local-only Expo app with AsyncStorage. All data access goes through a `storage.ts` module for future backend swap. Single-screen dashboard with person detail and challenge detail as secondary screens. No backend, no auth.

**Tech Stack:** Expo, React Native, TypeScript, AsyncStorage, expo-contacts, expo-notifications, date-fns, uuid

**Spec:** `docs/superpowers/specs/2026-03-31-brotation-v2-design.md`

---

## File Structure

```
brotation/
├── app.json
├── package.json
├── tsconfig.json
├── App.tsx                          # Root: NavigationContainer + screens
├── src/
│   ├── types.ts                     # All interfaces: Target, Interaction, Challenge
│   ├── constants.ts                 # Points map, stage thresholds, active cap, colors, stage defaults
│   ├── storage.ts                   # AsyncStorage CRUD — all data access
│   ├── challenges.ts                # Challenge computation: monthly/quarterly progress, streaks, suggestions
│   ├── notifications.ts             # Daily nudge scheduling + priority logic
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Main screen: challenge card + active roster + bench
│   │   ├── PersonDetailScreen.tsx   # Person profile: log, notes, history, actions
│   │   ├── ChallengeDetailScreen.tsx # Monthly/quarterly breakdowns, past results
│   │   ├── LogInteractionScreen.tsx # Pick person (if from FAB) → pick type → optional note
│   │   └── ContactImportScreen.tsx  # Multiselect contact picker from device phonebook
│   └── components/
│       ├── ChallengeCard.tsx        # Monthly progress, streak, quarterly chips
│       ├── PersonCard.tsx           # Active roster card: avatar, stage, last interaction, points
│       ├── BenchSection.tsx         # Collapsible bench list with activate buttons
│       ├── StageBadge.tsx           # Colored badge: Acquaintance/Building/Bro
│       ├── ProgressBar.tsx          # Reusable progress bar with gradient fill
│       └── Toast.tsx                # Points-earned toast: "☕ +5 pts with Dan"
├── __tests__/
│   ├── storage.test.ts
│   ├── challenges.test.ts
│   └── notifications.test.ts
```

---

## Task 1: Project Scaffold + Types + Constants

**Files:**
- Create: `brotation/package.json`
- Create: `brotation/app.json`
- Create: `brotation/tsconfig.json`
- Create: `brotation/App.tsx`
- Create: `brotation/src/types.ts`
- Create: `brotation/src/constants.ts`
- Create: `brotation/jest.config.js`

- [ ] **Step 1: Create new Expo project**

```bash
cd /Users/spall03
npx create-expo-app brotation --template blank-typescript
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/spall03/brotation
npx expo install @react-native-async-storage/async-storage expo-contacts expo-notifications date-fns expo-font
npm install uuid
npm install --save-dev @types/uuid jest ts-jest @types/jest
```

- [ ] **Step 3: Create Jest config**

Create `brotation/jest.config.js`:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
};
```

- [ ] **Step 4: Create types.ts**

Create `brotation/src/types.ts`:

```typescript
export type Stage = 'acquaintance' | 'building' | 'bro';

export type TargetStatus = 'active' | 'bench' | 'archive';

export type InteractionType = 'quick_touch' | 'real_conversation' | 'intentional_hangout';

export type ChallengeType = 'monthly_horizontal' | 'quarterly_vertical';

export interface Target {
  id: string;
  name: string;
  notes: string;
  phone?: string;
  email?: string;
  contactId?: string;
  stage: Stage;
  status: TargetStatus;
  totalPoints: number;
  createdAt: string; // ISO string for JSON serialization
}

export interface Interaction {
  id: string;
  targetId: string;
  type: InteractionType;
  points: number;
  note?: string;
  date: string; // ISO string
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  targetId?: string; // only for quarterly_vertical
  targetCount: number;
  periodStart: string; // ISO string
  periodEnd: string; // ISO string
}

export interface MonthlyResult {
  month: string; // "2026-03"
  target: number;
  actual: number;
  hit: boolean;
}
```

- [ ] **Step 5: Create constants.ts**

Create `brotation/src/constants.ts`:

```typescript
import { InteractionType, Stage } from './types';

export const POINTS: Record<InteractionType, number> = {
  quick_touch: 1,
  real_conversation: 5,
  intentional_hangout: 15,
};

export const STAGE_THRESHOLDS: Record<Stage, number> = {
  acquaintance: 0,
  building: 25,
  bro: 150,
};

export const STAGE_ORDER: Stage[] = ['acquaintance', 'building', 'bro'];

export const QUARTERLY_DEFAULTS: Record<Stage, number> = {
  acquaintance: 1,
  building: 2,
  bro: 3,
};

export const ACTIVE_CAP = 5;

// Surface hierarchy from Stitch "Brotherhood Framework" design system
export const COLORS = {
  surface: '#131313',
  surfaceContainerLowest: '#0E0E0E',
  surfaceContainerLow: '#1C1B1B',
  surfaceContainer: '#201F1F',
  surfaceContainerHigh: '#2A2A2A',
  surfaceContainerHighest: '#353534',
  surfaceBright: '#393939',
  text: '#E5E2E1',           // on-surface
  textSecondary: '#E0C0B1',  // on-surface-variant
  textMuted: '#A78B7D',      // outline
  textDim: '#584237',        // outline-variant
  accent: '#F97316',         // primary-container
  accentLight: '#FFB690',    // primary
  green: '#22C55E',
  greenDim: 'rgba(34, 197, 94, 0.15)',
  blue: '#3B82F6',
  blueDim: 'rgba(59, 130, 246, 0.15)',
  gold: '#FFDB3C',           // secondary-container
  goldDim: 'rgba(255, 219, 60, 0.15)',
  tertiary: '#E5812C',       // tertiary-container (used for Bro badge bg)
};

export const STAGE_COLORS: Record<Stage, { color: string; bg: string; badgeBg?: string }> = {
  acquaintance: { color: COLORS.green, bg: COLORS.greenDim },
  building: { color: COLORS.blue, bg: COLORS.blueDim },
  bro: { color: COLORS.gold, bg: COLORS.goldDim, badgeBg: COLORS.tertiary },
};

// Achievement glow shadow for Bro-status cards
export const BRO_GLOW = {
  shadowColor: COLORS.gold,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 15,
};
```

- [ ] **Step 6: Verify placeholder App.tsx runs**

Replace contents of `brotation/App.tsx` with:

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from './src/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Brotation</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: '700',
  },
});
```

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: app launches with "Brotation" in orange on dark background.

- [ ] **Step 7: Commit**

```bash
cd /Users/spall03/brotation
git init
git add .
git commit -m "chore: scaffold Brotation v2 — types, constants, Expo project"
```

---

## Task 2: Storage Module (TDD)

**Files:**
- Create: `brotation/src/storage.ts`
- Create: `brotation/__tests__/storage.test.ts`

- [ ] **Step 1: Write storage tests**

Create `brotation/__tests__/storage.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/spall03/brotation
npx jest
```

Expected: FAIL — cannot find module `../src/storage`.

- [ ] **Step 3: Implement storage.ts**

Create `brotation/src/storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Target, Interaction, Challenge, MonthlyResult } from './types';

const KEYS = {
  targets: 'brotation:targets',
  interactions: 'brotation:interactions',
  challenges: 'brotation:challenges',
  monthlyResults: 'brotation:monthlyResults',
} as const;

async function getList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// --- Targets ---

export async function getTargets(): Promise<Target[]> {
  return getList<Target>(KEYS.targets);
}

export async function saveTarget(target: Target): Promise<void> {
  const targets = await getTargets();
  const index = targets.findIndex((t) => t.id === target.id);
  if (index >= 0) {
    targets[index] = target;
  } else {
    targets.push(target);
  }
  await setList(KEYS.targets, targets);
}

export async function deleteTarget(id: string): Promise<void> {
  const targets = await getTargets();
  await setList(KEYS.targets, targets.filter((t) => t.id !== id));
}

// --- Interactions ---

export async function getInteractions(targetId?: string): Promise<Interaction[]> {
  const all = await getList<Interaction>(KEYS.interactions);
  return targetId ? all.filter((i) => i.targetId === targetId) : all;
}

export async function saveInteraction(interaction: Interaction): Promise<void> {
  const interactions = await getList<Interaction>(KEYS.interactions);
  interactions.push(interaction);
  await setList(KEYS.interactions, interactions);
}

// --- Challenges ---

export async function getChallenges(): Promise<Challenge[]> {
  return getList<Challenge>(KEYS.challenges);
}

export async function saveChallenge(challenge: Challenge): Promise<void> {
  const challenges = await getChallenges();
  const index = challenges.findIndex((c) => c.id === challenge.id);
  if (index >= 0) {
    challenges[index] = challenge;
  } else {
    challenges.push(challenge);
  }
  await setList(KEYS.challenges, challenges);
}

// --- Monthly Results ---

export async function getMonthlyResults(): Promise<MonthlyResult[]> {
  return getList<MonthlyResult>(KEYS.monthlyResults);
}

export async function saveMonthlyResult(result: MonthlyResult): Promise<void> {
  const results = await getMonthlyResults();
  const index = results.findIndex((r) => r.month === result.month);
  if (index >= 0) {
    results[index] = result;
  } else {
    results.push(result);
  }
  await setList(KEYS.monthlyResults, results);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/spall03/brotation
npx jest
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/spall03/brotation
git add src/storage.ts __tests__/storage.test.ts
git commit -m "feat: add storage module with AsyncStorage CRUD"
```

---

## Task 3: Challenge Computation Module (TDD)

**Files:**
- Create: `brotation/src/challenges.ts`
- Create: `brotation/__tests__/challenges.test.ts`

- [ ] **Step 1: Write challenge computation tests**

Create `brotation/__tests__/challenges.test.ts`:

```typescript
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
    // Most recent is March (miss), so streak is 0
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/spall03/brotation
npx jest __tests__/challenges.test.ts
```

Expected: FAIL — cannot find module `../src/challenges`.

- [ ] **Step 3: Implement challenges.ts**

Create `brotation/src/challenges.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/spall03/brotation
npx jest __tests__/challenges.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/spall03/brotation
git add src/challenges.ts __tests__/challenges.test.ts
git commit -m "feat: add challenge computation — monthly/quarterly progress, streaks, stages"
```

---

## Task 4: Navigation + Dashboard Screen Shell

**Files:**
- Modify: `brotation/App.tsx`
- Create: `brotation/src/screens/DashboardScreen.tsx`
- Create: `brotation/src/screens/PersonDetailScreen.tsx`
- Create: `brotation/src/screens/ChallengeDetailScreen.tsx`
- Create: `brotation/src/screens/LogInteractionScreen.tsx`

- [ ] **Step 1: Install navigation dependencies**

```bash
cd /Users/spall03/brotation
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

- [ ] **Step 2: Create placeholder screens**

Create `brotation/src/screens/PersonDetailScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

export function PersonDetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Person: {route.params.targetId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontSize: 18 },
});
```

Create `brotation/src/screens/ChallengeDetailScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export function ChallengeDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Challenge Details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontSize: 18 },
});
```

Create `brotation/src/screens/LogInteractionScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'LogInteraction'>;

export function LogInteractionScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Log Interaction{route.params?.targetId ? ` for ${route.params.targetId}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontSize: 18 },
});
```

- [ ] **Step 3: Create DashboardScreen shell**

Create `brotation/src/screens/DashboardScreen.tsx`:

```typescript
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../constants';
import { Target, Interaction, MonthlyResult } from '../types';
import { getTargets, getInteractions, getMonthlyResults } from '../storage';
import { getCurrentMonth, suggestMonthlyTarget, getMonthlyHorizontalProgress, getCurrentStreak } from '../challenges';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  const loadData = useCallback(async () => {
    const [t, i, r] = await Promise.all([
      getTargets(),
      getInteractions(),
      getMonthlyResults(),
    ]);
    setTargets(t);
    setInteractions(i);
    setMonthlyResults(r);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeTargets = targets.filter((t) => t.status === 'active');
  const benchTargets = targets.filter((t) => t.status === 'bench');
  const currentMonth = getCurrentMonth();
  const monthlyTarget = suggestMonthlyTarget(activeTargets.length);
  const monthlyProgress = getMonthlyHorizontalProgress(interactions, currentMonth);
  const streak = getCurrentStreak(monthlyResults);

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BROTATION</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>{monthLabel}</Text>
          </View>
        </View>

        {/* Challenge Card — placeholder, built in Task 5 */}
        <TouchableOpacity
          style={styles.challengePlaceholder}
          onPress={() => navigation.navigate('ChallengeDetail')}
        >
          <Text style={styles.challengeLabel}>MONTHLY CHALLENGE</Text>
          <Text style={styles.challengeNumber}>
            {monthlyProgress} <Text style={styles.challengeTarget}>/ {monthlyTarget}</Text>
          </Text>
          {streak > 0 && <Text style={styles.streak}>🔥 {streak} mo streak</Text>}
        </TouchableOpacity>

        {/* Active Roster — placeholder, cards built in Task 6 */}
        <Text style={styles.sectionLabel}>Active</Text>
        {activeTargets.map((target) => (
          <TouchableOpacity
            key={target.id}
            style={styles.personPlaceholder}
            onPress={() => navigation.navigate('PersonDetail', { targetId: target.id })}
          >
            <Text style={styles.personName}>{target.name}</Text>
            <Text style={styles.personPoints}>{target.totalPoints} pts</Text>
          </TouchableOpacity>
        ))}
        {activeTargets.length === 0 && (
          <Text style={styles.emptyText}>No active targets yet. Import contacts to get started.</Text>
        )}

        {/* Bench — placeholder, built in Task 6 */}
        {benchTargets.length > 0 && (
          <View style={styles.benchPlaceholder}>
            <Text style={styles.benchText}>{benchTargets.length} on the bench</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogInteraction', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  monthPill: { backgroundColor: COLORS.surfaceContainer, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  monthText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  challengePlaceholder: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 20, marginBottom: 24 },
  challengeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.accent, marginBottom: 8 },
  challengeNumber: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  challengeTarget: { fontSize: 32, fontWeight: '300', color: COLORS.textDim },
  streak: { fontSize: 12, color: COLORS.gold, marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase' },
  personPlaceholder: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  personPoints: { color: COLORS.textMuted, fontSize: 16, fontWeight: '700' },
  emptyText: { color: COLORS.textDim, fontSize: 14, textAlign: 'center', marginVertical: 20 },
  benchPlaceholder: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginTop: 20 },
  benchText: { color: COLORS.textMuted, fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 36, right: 24, width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
```

- [ ] **Step 4: Wire up App.tsx with navigation**

Replace `brotation/App.tsx`:

```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PersonDetailScreen } from './src/screens/PersonDetailScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { LogInteractionScreen } from './src/screens/LogInteractionScreen';
import { COLORS } from './src/constants';

export type RootStackParamList = {
  Dashboard: undefined;
  PersonDetail: { targetId: string };
  ChallengeDetail: undefined;
  LogInteraction: { targetId?: string };
  ContactImport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.surface },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
        <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
        <Stack.Screen name="LogInteraction" component={LogInteractionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 5: Verify app runs with navigation**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: app launches with dashboard showing "BROTATION" header, empty challenge card showing "0 / 1", empty state text, and orange FAB.

- [ ] **Step 6: Commit**

```bash
cd /Users/spall03/brotation
git add App.tsx src/screens/
git commit -m "feat: add navigation and dashboard screen shell"
```

---

## Task 5: ChallengeCard + ProgressBar + StageBadge Components

**Files:**
- Create: `brotation/src/components/ChallengeCard.tsx`
- Create: `brotation/src/components/ProgressBar.tsx`
- Create: `brotation/src/components/StageBadge.tsx`
- Modify: `brotation/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Create ProgressBar component**

Create `brotation/src/components/ProgressBar.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 8, color = COLORS.accent }: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
});
```

- [ ] **Step 2: Create StageBadge component**

Create `brotation/src/components/StageBadge.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stage } from '../types';
import { STAGE_COLORS } from '../constants';

interface StageBadgeProps {
  stage: Stage;
}

const LABELS: Record<Stage, string> = {
  acquaintance: 'Acquaintance',
  building: 'Building',
  bro: 'Bro',
};

export function StageBadge({ stage }: StageBadgeProps) {
  const { color, bg } = STAGE_COLORS[stage];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color }]}>{LABELS[stage]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});
```

- [ ] **Step 3: Create ChallengeCard component**

Create `brotation/src/components/ChallengeCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, QUARTERLY_DEFAULTS, STAGE_COLORS } from '../constants';
import { Target, Interaction } from '../types';
import { getQuarterlyVerticalProgress, getCurrentQuarter } from '../challenges';
import { ProgressBar } from './ProgressBar';

interface ChallengeCardProps {
  monthlyProgress: number;
  monthlyTarget: number;
  streak: number;
  activeTargets: Target[];
  interactions: Interaction[];
  onPress: () => void;
}

export function ChallengeCard({
  monthlyProgress,
  monthlyTarget,
  streak,
  activeTargets,
  interactions,
  onPress,
}: ChallengeCardProps) {
  const quarter = getCurrentQuarter();
  const progress = monthlyTarget > 0 ? monthlyProgress / monthlyTarget : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topBar} />
      <View style={styles.header}>
        <Text style={styles.label}>MONTHLY CHALLENGE</Text>
        {streak > 0 && <Text style={styles.streak}>🔥 {streak} mo streak</Text>}
      </View>

      <View style={styles.numberRow}>
        <Text style={styles.number}>{monthlyProgress}</Text>
        <Text style={styles.target}> / {monthlyTarget}</Text>
      </View>
      <Text style={styles.desc}>Hang out with {monthlyTarget} different {monthlyTarget === 1 ? 'guy' : 'guys'} this month</Text>

      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
      </View>

      {activeTargets.length > 0 && (
        <View style={styles.chips}>
          {activeTargets.map((target) => {
            const qTarget = QUARTERLY_DEFAULTS[target.stage];
            const qProgress = getQuarterlyVerticalProgress(interactions, target.id, quarter);
            const hit = qProgress >= qTarget;
            const chipColor = hit ? COLORS.textDim : STAGE_COLORS[target.stage].color;
            const firstName = target.name.split(' ')[0];

            return (
              <View key={target.id} style={styles.chip}>
                <Text style={styles.chipName}>{firstName}</Text>
                <Text style={[styles.chipVal, { color: chipColor }]}>{qProgress}/{qTarget}</Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 20, marginBottom: 24, overflow: 'hidden' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.accent },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.accent },
  streak: { fontSize: 12, color: COLORS.gold },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  number: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  target: { fontSize: 32, fontWeight: '300', color: COLORS.textDim },
  desc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  chips: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 10, padding: 10, alignItems: 'center' },
  chipName: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  chipVal: { fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 4: Replace dashboard placeholder with ChallengeCard**

In `brotation/src/screens/DashboardScreen.tsx`, replace the challenge placeholder `TouchableOpacity` (the block from `{/* Challenge Card` to the closing `</TouchableOpacity>`) with:

```typescript
import { ChallengeCard } from '../components/ChallengeCard';
```

And in the JSX, replace the challenge placeholder with:

```tsx
<ChallengeCard
  monthlyProgress={monthlyProgress}
  monthlyTarget={monthlyTarget}
  streak={streak}
  activeTargets={activeTargets}
  interactions={interactions}
  onPress={() => navigation.navigate('ChallengeDetail')}
/>
```

Remove the now-unused styles: `challengePlaceholder`, `challengeLabel`, `challengeNumber`, `challengeTarget`, `streak`.

- [ ] **Step 5: Verify components render**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: challenge card renders with orange top bar, "0 / 1" text, progress bar, no quarterly chips (no active targets yet).

- [ ] **Step 6: Commit**

```bash
cd /Users/spall03/brotation
git add src/components/ProgressBar.tsx src/components/StageBadge.tsx src/components/ChallengeCard.tsx src/screens/DashboardScreen.tsx
git commit -m "feat: add ChallengeCard, ProgressBar, and StageBadge components"
```

---

## Task 6: PersonCard + BenchSection + Dashboard Integration

**Files:**
- Create: `brotation/src/components/PersonCard.tsx`
- Create: `brotation/src/components/BenchSection.tsx`
- Modify: `brotation/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Create PersonCard component**

Create `brotation/src/components/PersonCard.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, STAGE_COLORS, STAGE_THRESHOLDS } from '../constants';
import { Target, Interaction } from '../types';
import { StageBadge } from './StageBadge';
import { ProgressBar } from './ProgressBar';
import { formatDistanceToNowStrict } from 'date-fns';

interface PersonCardProps {
  target: Target;
  lastInteraction?: Interaction;
  onPress: () => void;
}

export function PersonCard({ target, lastInteraction, onPress }: PersonCardProps) {
  const initials = target.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { color, bg } = STAGE_COLORS[target.stage];

  // Progress toward next stage
  const nextStage = target.stage === 'acquaintance' ? 'building' : target.stage === 'building' ? 'bro' : null;
  const nextThreshold = nextStage ? STAGE_THRESHOLDS[nextStage] : STAGE_THRESHOLDS.bro;
  const currentThreshold = STAGE_THRESHOLDS[target.stage];
  const stageProgress = nextStage
    ? (target.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;

  const lastText = lastInteraction
    ? formatDistanceToNowStrict(new Date(lastInteraction.date), { addSuffix: true })
    : 'No interactions yet';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: bg, borderColor: color }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{target.name}</Text>
          <StageBadge stage={target.stage} />
        </View>
        <Text style={styles.lastText}>{lastText}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.points}>{target.totalPoints}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
        <View style={styles.miniProgress}>
          <ProgressBar progress={stageProgress} height={4} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  lastText: { fontSize: 13, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', flexShrink: 0 },
  points: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  pointsLabel: { fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniProgress: { width: 48, marginTop: 6 },
});
```

- [ ] **Step 2: Create BenchSection component**

Create `brotation/src/components/BenchSection.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, ACTIVE_CAP } from '../constants';
import { Target } from '../types';

interface BenchSectionProps {
  targets: Target[];
  activeCount: number;
  onActivate: (targetId: string) => void;
  onPress: (targetId: string) => void;
}

export function BenchSection({ targets, activeCount, onActivate, onPress }: BenchSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (targets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Bench</Text>

      <TouchableOpacity style={styles.toggle} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.toggleLabel}>{targets.length} more {targets.length === 1 ? 'person' : 'people'}</Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && targets.map((target) => {
        const initials = target.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        const canActivate = activeCount < ACTIVE_CAP;

        return (
          <TouchableOpacity
            key={target.id}
            style={styles.benchPerson}
            onPress={() => onPress(target.id)}
            activeOpacity={0.7}
          >
            <View style={styles.benchAvatar}>
              <Text style={styles.benchAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.benchName}>{target.name}</Text>
            {canActivate && (
              <TouchableOpacity
                style={styles.activateBtn}
                onPress={(e) => { e.stopPropagation(); onActivate(target.id); }}
              >
                <Text style={styles.activateBtnText}>Activate</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase',
  },
  toggle: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12,
    padding: 14, paddingHorizontal: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  arrow: { fontSize: 12, color: COLORS.textDim },
  benchPerson: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12,
    padding: 12, paddingHorizontal: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.7,
  },
  benchAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  benchAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.textDim },
  benchName: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  activateBtn: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  activateBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
});
```

- [ ] **Step 3: Integrate PersonCard and BenchSection into DashboardScreen**

Update `brotation/src/screens/DashboardScreen.tsx`:

Add imports:

```typescript
import { PersonCard } from '../components/PersonCard';
import { BenchSection } from '../components/BenchSection';
import { saveTarget } from '../storage';
```

Add a helper to find the last interaction per target:

```typescript
function getLastInteraction(interactions: Interaction[], targetId: string): Interaction | undefined {
  return interactions
    .filter((i) => i.targetId === targetId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
```

Add an activate handler:

```typescript
const handleActivate = async (targetId: string) => {
  const target = targets.find((t) => t.id === targetId);
  if (!target) return;
  await saveTarget({ ...target, status: 'active' });
  loadData();
};
```

Replace the active roster placeholder block (the `{activeTargets.map(...)}` and empty state) with:

```tsx
{activeTargets.map((target) => (
  <PersonCard
    key={target.id}
    target={target}
    lastInteraction={getLastInteraction(interactions, target.id)}
    onPress={() => navigation.navigate('PersonDetail', { targetId: target.id })}
  />
))}
{activeTargets.length === 0 && (
  <Text style={styles.emptyText}>No active targets yet. Import contacts to get started.</Text>
)}
```

Replace the bench placeholder with:

```tsx
<BenchSection
  targets={benchTargets}
  activeCount={activeTargets.length}
  onActivate={handleActivate}
  onPress={(targetId) => navigation.navigate('PersonDetail', { targetId })}
/>
```

Remove unused styles: `personPlaceholder`, `personName`, `personPoints`, `benchPlaceholder`, `benchText`.

- [ ] **Step 4: Verify components render**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: dashboard renders with empty state. No visual regressions.

- [ ] **Step 5: Commit**

```bash
cd /Users/spall03/brotation
git add src/components/PersonCard.tsx src/components/BenchSection.tsx src/screens/DashboardScreen.tsx
git commit -m "feat: add PersonCard and BenchSection to dashboard"
```

---

## Task 7: Log Interaction Screen + Toast

**Files:**
- Create: `brotation/src/components/Toast.tsx`
- Modify: `brotation/src/screens/LogInteractionScreen.tsx`

- [ ] **Step 1: Create Toast component**

Create `brotation/src/components/Toast.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  text: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
});
```

- [ ] **Step 2: Build LogInteractionScreen**

Replace `brotation/src/screens/LogInteractionScreen.tsx`:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert } from 'react-native';
import { COLORS, POINTS, ACTIVE_CAP, STAGE_COLORS } from '../constants';
import { Target, InteractionType } from '../types';
import { getTargets, saveTarget, saveInteraction } from '../storage';
import { getStageForPoints } from '../challenges';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { v4 as uuid } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'LogInteraction'>;

const INTERACTION_OPTIONS: { type: InteractionType; label: string; emoji: string; points: number }[] = [
  { type: 'quick_touch', label: 'Quick Touch', emoji: '💬', points: POINTS.quick_touch },
  { type: 'real_conversation', label: 'Real Conversation', emoji: '🗣️', points: POINTS.real_conversation },
  { type: 'intentional_hangout', label: 'Intentional Hangout', emoji: '🤝', points: POINTS.intentional_hangout },
];

export function LogInteractionScreen({ navigation, route }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(route.params?.targetId);
  const [selectedType, setSelectedType] = useState<InteractionType | undefined>();
  const [note, setNote] = useState('');

  useEffect(() => {
    getTargets().then(setTargets);
  }, []);

  const activeTargets = targets.filter((t) => t.status === 'active');
  const benchTargets = targets.filter((t) => t.status === 'bench');
  const selectedTarget = targets.find((t) => t.id === selectedTargetId);

  const handleSave = useCallback(async () => {
    if (!selectedTargetId || !selectedType) return;

    const target = targets.find((t) => t.id === selectedTargetId);
    if (!target) return;

    const points = POINTS[selectedType];

    // Save interaction
    await saveInteraction({
      id: uuid(),
      targetId: selectedTargetId,
      type: selectedType,
      points,
      note: note.trim() || undefined,
      date: new Date().toISOString(),
    });

    // Update target points and stage
    const newPoints = target.totalPoints + points;
    const newStage = getStageForPoints(newPoints);
    await saveTarget({ ...target, totalPoints: newPoints, stage: newStage });

    // If bench target, prompt to activate
    if (target.status === 'bench') {
      const activeCount = activeTargets.length;
      if (activeCount < ACTIVE_CAP) {
        Alert.alert(
          `Move ${target.name.split(' ')[0]} to Active?`,
          'You logged an interaction — want to start actively tracking them?',
          [
            { text: 'Keep on Bench', style: 'cancel', onPress: () => goBack(points, target.name) },
            {
              text: 'Activate',
              onPress: async () => {
                await saveTarget({ ...target, totalPoints: newPoints, stage: newStage, status: 'active' });
                goBack(points, target.name);
              },
            },
          ],
        );
        return;
      }
    }

    goBack(points, target.name);
  }, [selectedTargetId, selectedType, note, targets]);

  const goBack = (points: number, name: string) => {
    const firstName = name.split(' ')[0];
    navigation.navigate('Dashboard');
    // Toast is handled by Dashboard via params — simplified: just go back
  };

  // Step 1: Pick person (skip if pre-selected)
  if (!selectedTargetId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Interaction</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {activeTargets.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Active</Text>
              {activeTargets.map((t) => (
                <TouchableOpacity key={t.id} style={styles.personRow} onPress={() => setSelectedTargetId(t.id)}>
                  <View style={[styles.smallAvatar, { backgroundColor: STAGE_COLORS[t.stage].bg }]}>
                    <Text style={[styles.smallAvatarText, { color: STAGE_COLORS[t.stage].color }]}>
                      {t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={styles.personRowName}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {benchTargets.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Bench</Text>
              {benchTargets.map((t) => (
                <TouchableOpacity key={t.id} style={[styles.personRow, { opacity: 0.6 }]} onPress={() => setSelectedTargetId(t.id)}>
                  <View style={styles.smallAvatarDim}>
                    <Text style={styles.smallAvatarTextDim}>
                      {t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={styles.personRowName}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Pick type + optional note
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectedTargetId === route.params?.targetId ? navigation.goBack() : setSelectedTargetId(undefined)}>
          <Text style={styles.cancelBtn}>{selectedTargetId === route.params?.targetId ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTarget?.name.split(' ')[0]}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!selectedType}>
          <Text style={[styles.saveBtn, !selectedType && styles.saveBtnDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>What happened?</Text>
        {INTERACTION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={[styles.typeCard, selectedType === option.type && styles.typeCardSelected]}
            onPress={() => setSelectedType(option.type)}
            activeOpacity={0.7}
          >
            <Text style={styles.typeEmoji}>{option.emoji}</Text>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>{option.label}</Text>
              <Text style={styles.typePoints}>+{option.points} pts</Text>
            </View>
            {selectedType === option.type && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Talked about camping trip..."
          placeholderTextColor={COLORS.textDim}
          multiline
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cancelBtn: { fontSize: 17, color: COLORS.accent },
  saveBtn: { fontSize: 17, fontWeight: '700', color: COLORS.accent },
  saveBtnDisabled: { color: COLORS.textDim },
  scroll: { padding: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase',
  },
  personRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  personRowName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  smallAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  smallAvatarText: { fontSize: 15, fontWeight: '700' },
  smallAvatarDim: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  smallAvatarTextDim: { fontSize: 15, fontWeight: '700', color: COLORS.textDim },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surfaceContainer, borderRadius: 14,
    padding: 18, marginBottom: 10,
  },
  typeCardSelected: { backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.accent },
  typeEmoji: { fontSize: 28 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  typePoints: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginTop: 2 },
  checkmark: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  noteInput: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12,
    padding: 16, fontSize: 15, color: COLORS.text,
    minHeight: 80, textAlignVertical: 'top',
  },
});
```

- [ ] **Step 3: Verify logging flow works**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: tapping FAB shows person picker (empty until contacts imported). Navigation works, Cancel goes back.

- [ ] **Step 4: Commit**

```bash
cd /Users/spall03/brotation
git add src/components/Toast.tsx src/screens/LogInteractionScreen.tsx
git commit -m "feat: add log interaction screen with person picker and type selector"
```

---

## Task 8: Person Detail Screen

**Files:**
- Modify: `brotation/src/screens/PersonDetailScreen.tsx`

- [ ] **Step 1: Build PersonDetailScreen**

Replace `brotation/src/screens/PersonDetailScreen.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert,
} from 'react-native';
import { COLORS, POINTS, STAGE_COLORS, STAGE_THRESHOLDS, STAGE_ORDER } from '../constants';
import { Target, Interaction, InteractionType, Stage } from '../types';
import { getTargets, getInteractions, saveTarget, saveInteraction, deleteTarget } from '../storage';
import { getStageForPoints } from '../challenges';
import { StageBadge } from '../components/StageBadge';
import { ProgressBar } from '../components/ProgressBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { formatDistanceToNowStrict, format } from 'date-fns';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

const INTERACTION_LABELS: Record<InteractionType, string> = {
  quick_touch: '💬 Quick Touch',
  real_conversation: '🗣️ Real Conversation',
  intentional_hangout: '🤝 Intentional Hangout',
};

export function PersonDetailScreen({ route, navigation }: Props) {
  const { targetId } = route.params;
  const [target, setTarget] = useState<Target | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const targets = await getTargets();
    const t = targets.find((x) => x.id === targetId) ?? null;
    setTarget(t);
    setNotes(t?.notes ?? '');
    const ints = await getInteractions(targetId);
    setInteractions(ints.sort((a, b) => b.date.localeCompare(a.date)));
  }, [targetId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!target) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Target not found</Text>
      </SafeAreaView>
    );
  }

  const { color, bg } = STAGE_COLORS[target.stage];
  const initials = target.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const nextStage = target.stage === 'acquaintance' ? 'building' : target.stage === 'building' ? 'bro' : null;
  const nextThreshold = nextStage ? STAGE_THRESHOLDS[nextStage] : STAGE_THRESHOLDS.bro;
  const currentThreshold = STAGE_THRESHOLDS[target.stage];
  const stageProgress = nextStage
    ? (target.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;

  const handleQuickLog = async (type: InteractionType) => {
    const points = POINTS[type];
    await saveInteraction({
      id: uuid(),
      targetId: target.id,
      type,
      points,
      date: new Date().toISOString(),
    });
    const newPoints = target.totalPoints + points;
    const newStage = getStageForPoints(newPoints);
    await saveTarget({ ...target, totalPoints: newPoints, stage: newStage });
    loadData();
  };

  const handleSaveNotes = async () => {
    await saveTarget({ ...target, notes: notes.trim() });
    setEditingNotes(false);
    loadData();
  };

  const handleStatusChange = async (status: 'active' | 'bench' | 'archive') => {
    await saveTarget({ ...target, status });
    navigation.goBack();
  };

  const handleStageOverride = async (stage: Stage) => {
    await saveTarget({ ...target, stage });
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: bg, borderColor: color }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{target.name}</Text>
          <View style={styles.stageRow}>
            <StageBadge stage={target.stage} />
            <Text style={styles.pointsText}>{target.totalPoints} pts</Text>
          </View>
          {nextStage && (
            <View style={styles.progressRow}>
              <ProgressBar progress={stageProgress} height={6} color={color} />
              <Text style={styles.progressLabel}>{nextThreshold - target.totalPoints} pts to {nextStage === 'bro' ? 'Bro' : 'Building'}</Text>
            </View>
          )}
        </View>

        {/* Quick log */}
        <Text style={styles.sectionLabel}>Quick Log</Text>
        <View style={styles.quickLogRow}>
          {(['quick_touch', 'real_conversation', 'intentional_hangout'] as InteractionType[]).map((type) => (
            <TouchableOpacity key={type} style={styles.quickLogBtn} onPress={() => handleQuickLog(type)}>
              <Text style={styles.quickLogEmoji}>{type === 'quick_touch' ? '💬' : type === 'real_conversation' ? '🗣️' : '🤝'}</Text>
              <Text style={styles.quickLogPoints}>+{POINTS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Notes</Text>
        {editingNotes ? (
          <View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Kids in same class, likes hiking..."
              placeholderTextColor={COLORS.textDim}
              autoFocus
            />
            <View style={styles.notesActions}>
              <TouchableOpacity onPress={() => { setEditingNotes(false); setNotes(target.notes); }}>
                <Text style={styles.notesCancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotes}>
                <Text style={styles.notesSaveBtn}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.notesDisplay} onPress={() => setEditingNotes(true)}>
            <Text style={target.notes ? styles.notesText : styles.notesPlaceholder}>
              {target.notes || 'Tap to add notes...'}
            </Text>
          </TouchableOpacity>
        )}

        {/* History */}
        <Text style={styles.sectionLabel}>History</Text>
        {interactions.length === 0 && <Text style={styles.emptyText}>No interactions yet</Text>}
        {interactions.map((interaction) => (
          <View key={interaction.id} style={styles.historyRow}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyType}>{INTERACTION_LABELS[interaction.type]}</Text>
              {interaction.note && <Text style={styles.historyNote}>{interaction.note}</Text>}
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyDate}>{format(new Date(interaction.date), 'MMM d')}</Text>
              <Text style={styles.historyAgo}>{formatDistanceToNowStrict(new Date(interaction.date), { addSuffix: true })}</Text>
            </View>
          </View>
        ))}

        {/* Actions */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Actions</Text>

        {/* Stage override */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupLabel}>Override Stage</Text>
          <View style={styles.stageButtons}>
            {STAGE_ORDER.map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.stageBtn,
                  target.stage === stage && { backgroundColor: STAGE_COLORS[stage].bg },
                ]}
                onPress={() => handleStageOverride(stage)}
              >
                <Text style={[styles.stageBtnText, { color: STAGE_COLORS[stage].color }]}>
                  {stage === 'bro' ? 'Bro' : stage === 'building' ? 'Building' : 'Acquaintance'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status actions */}
        <View style={styles.actionGroup}>
          {target.status === 'active' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('bench')}>
              <Text style={styles.actionBtnText}>Move to Bench</Text>
            </TouchableOpacity>
          )}
          {target.status === 'bench' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('active')}>
              <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Activate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('archive')}>
            <Text style={[styles.actionBtnText, { color: COLORS.textDim }]}>Archive</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { fontSize: 17, color: COLORS.accent },
  scroll: { padding: 20, paddingBottom: 40 },
  errorText: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginTop: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  progressRow: { width: '100%', marginTop: 16 },
  progressLabel: { fontSize: 12, color: COLORS.textDim, marginTop: 6, textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: COLORS.textDim, marginBottom: 12, marginTop: 8, textTransform: 'uppercase',
  },
  quickLogRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickLogBtn: {
    flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  quickLogEmoji: { fontSize: 28, marginBottom: 4 },
  quickLogPoints: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  notesDisplay: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  notesText: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
  notesPlaceholder: { color: COLORS.textDim, fontSize: 15, fontStyle: 'italic' },
  notesInput: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16,
    fontSize: 15, color: COLORS.text, minHeight: 80, textAlignVertical: 'top',
  },
  notesActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8, marginBottom: 24 },
  notesCancelBtn: { fontSize: 15, color: COLORS.textMuted },
  notesSaveBtn: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  historyRow: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  historyNote: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  historyRight: { alignItems: 'flex-end' },
  historyDate: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  historyAgo: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  emptyText: { color: COLORS.textDim, fontSize: 14, marginBottom: 24 },
  actionGroup: { marginBottom: 16 },
  actionGroupLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  stageButtons: { flexDirection: 'row', gap: 8 },
  stageBtn: {
    flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: 10,
    padding: 10, alignItems: 'center',
  },
  stageBtnText: { fontSize: 12, fontWeight: '700' },
  actionBtn: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});
```

- [ ] **Step 2: Verify person detail screen works**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: tapping a person card navigates to detail screen with profile header, quick log buttons, notes, history, and actions.

- [ ] **Step 3: Commit**

```bash
cd /Users/spall03/brotation
git add src/screens/PersonDetailScreen.tsx
git commit -m "feat: build person detail screen — profile, quick log, notes, history, actions"
```

---

## Task 9: Contact Import Screen

**Files:**
- Create: `brotation/src/screens/ContactImportScreen.tsx`
- Modify: `brotation/App.tsx`
- Modify: `brotation/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Create ContactImportScreen**

Create `brotation/src/screens/ContactImportScreen.tsx`:

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { COLORS } from '../constants';
import { Target } from '../types';
import { getTargets, saveTarget } from '../storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { v4 as uuid } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactImport'>;

interface SelectedContact {
  contactId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export function ContactImportScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contacts.ExistingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Map<string, SelectedContact>>(new Map());
  const [existingContactIds, setExistingContactIds] = useState<Set<string>>(new Set());
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load existing targets to filter duplicates
    const targets = await getTargets();
    setExistingContactIds(new Set(targets.map((t) => t.contactId).filter(Boolean) as string[]));
    setExistingNames(new Set(targets.map((t) => t.name.toLowerCase())));

    // Load device contacts
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to contacts in Settings.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    setContacts(data);
    setLoading(false);
  }

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (!c.firstName && !c.lastName) return false;
      if (existingContactIds.has(c.id)) return false;
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ');
      if (existingNames.has(fullName.toLowerCase())) return false;
      if (search) {
        return fullName.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [contacts, search, existingContactIds, existingNames]);

  function toggleContact(contact: Contacts.ExistingContact) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(contact.id)) {
        next.delete(contact.id);
      } else {
        next.set(contact.id, {
          contactId: contact.id,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          phone: contact.phoneNumbers?.[0]?.number,
          email: contact.emails?.[0]?.email,
        });
      }
      return next;
    });
  }

  async function handleImport() {
    const contacts = Array.from(selected.values());
    for (const c of contacts) {
      const target: Target = {
        id: uuid(),
        name: [c.firstName, c.lastName].filter(Boolean).join(' '),
        notes: '',
        phone: c.phone,
        email: c.email,
        contactId: c.contactId,
        stage: 'acquaintance',
        status: 'bench',
        totalPoints: 0,
        createdAt: new Date().toISOString(),
      };
      await saveTarget(target);
    }
    navigation.goBack();
  }

  const selectedCount = selected.size;

  function renderContact({ item }: { item: Contacts.ExistingContact }) {
    const isSelected = selected.has(item.id);
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
    const initials = [item.firstName?.[0], item.lastName?.[0]].filter(Boolean).join('').toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.contactRow, isSelected && styles.contactRowSelected]}
        onPress={() => toggleContact(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>{initials || '?'}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{fullName}</Text>
          {item.phoneNumbers?.[0]?.number && (
            <Text style={styles.contactDetail}>{item.phoneNumbers[0].number}</Text>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Contacts</Text>
        <TouchableOpacity onPress={handleImport} disabled={selectedCount === 0}>
          <Text style={[styles.importBtn, selectedCount === 0 && styles.importBtnDisabled]}>
            Add{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts..."
          placeholderTextColor={COLORS.textDim}
          autoCorrect={false}
        />
      </View>

      {selectedCount > 0 && (
        <View style={styles.counterBar}>
          <Text style={styles.counterText}>{selectedCount} selected</Text>
        </View>
      )}

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cancelBtn: { fontSize: 17, color: COLORS.accent },
  importBtn: { fontSize: 17, fontWeight: '700', color: COLORS.accent },
  importBtnDisabled: { color: COLORS.textDim },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: COLORS.text,
  },
  counterBar: {
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  counterText: { fontSize: 13, fontWeight: '600', color: COLORS.accent, textAlign: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', marginTop: 12 },
  listContent: { paddingBottom: 40 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  contactRowSelected: { backgroundColor: 'rgba(249, 115, 22, 0.05)' },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarSelected: { backgroundColor: COLORS.accent },
  avatarText: { fontSize: 15, fontWeight: '600', color: COLORS.textDim },
  avatarTextSelected: { color: '#FFFFFF' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  contactDetail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
```

- [ ] **Step 2: Register ContactImport screen in App.tsx**

In `brotation/App.tsx`, add the import:

```typescript
import { ContactImportScreen } from './src/screens/ContactImportScreen';
```

Add the screen to the Stack.Navigator, after LogInteraction:

```tsx
<Stack.Screen name="ContactImport" component={ContactImportScreen} />
```

- [ ] **Step 3: Add import button to DashboardScreen**

In `brotation/src/screens/DashboardScreen.tsx`, add a button below the empty state text (inside the `activeTargets.length === 0` block):

```tsx
{activeTargets.length === 0 && (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No active targets yet.</Text>
    <TouchableOpacity
      style={styles.importBtn}
      onPress={() => navigation.navigate('ContactImport')}
    >
      <Text style={styles.importBtnText}>Import from Contacts</Text>
    </TouchableOpacity>
  </View>
)}
```

Add styles:

```typescript
emptyContainer: { alignItems: 'center', marginVertical: 20 },
importBtn: {
  backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 12,
},
importBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
```

Also add an "Add" button to the header for when there are already people:

In the header View, after the monthPill, add:

```tsx
<TouchableOpacity onPress={() => navigation.navigate('ContactImport')}>
  <Text style={styles.addBtn}>Add</Text>
</TouchableOpacity>
```

Style:

```typescript
addBtn: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
```

Update the header to have the month pill centered and add button on the right by wrapping the month pill and add button appropriately.

- [ ] **Step 4: Verify contact import flow**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: empty state shows "Import from Contacts" button. Tapping opens contact picker. Selecting contacts and tapping "Add" creates targets on Bench. Returning to dashboard shows bench section.

- [ ] **Step 5: Commit**

```bash
cd /Users/spall03/brotation
git add src/screens/ContactImportScreen.tsx src/screens/DashboardScreen.tsx App.tsx
git commit -m "feat: add contact import with multiselect picker"
```

---

## Task 10: Challenge Detail Screen

**Files:**
- Modify: `brotation/src/screens/ChallengeDetailScreen.tsx`

- [ ] **Step 1: Build ChallengeDetailScreen**

Replace `brotation/src/screens/ChallengeDetailScreen.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, QUARTERLY_DEFAULTS, STAGE_COLORS } from '../constants';
import { Target, Interaction, MonthlyResult } from '../types';
import { getTargets, getInteractions, getMonthlyResults } from '../storage';
import {
  getCurrentMonth, getCurrentQuarter, suggestMonthlyTarget,
  getMonthlyHorizontalProgress, getQuarterlyVerticalProgress, getCurrentStreak,
} from '../challenges';
import { ProgressBar } from '../components/ProgressBar';
import { StageBadge } from '../components/StageBadge';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

export function ChallengeDetailScreen({ navigation }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  const loadData = useCallback(async () => {
    const [t, i, r] = await Promise.all([getTargets(), getInteractions(), getMonthlyResults()]);
    setTargets(t);
    setInteractions(i);
    setMonthlyResults(r);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeTargets = targets.filter((t) => t.status === 'active');
  const currentMonth = getCurrentMonth();
  const currentQuarter = getCurrentQuarter();
  const monthlyTarget = suggestMonthlyTarget(activeTargets.length);
  const monthlyProgress = getMonthlyHorizontalProgress(interactions, currentMonth);
  const streak = getCurrentStreak(monthlyResults);

  const sortedResults = [...monthlyResults].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Monthly */}
        <Text style={styles.sectionLabel}>This Month</Text>
        <View style={styles.card}>
          <View style={styles.monthlyRow}>
            <Text style={styles.bigNumber}>{monthlyProgress}</Text>
            <Text style={styles.bigTarget}> / {monthlyTarget}</Text>
          </View>
          <Text style={styles.monthlyDesc}>different guys this month</Text>
          <ProgressBar progress={monthlyTarget > 0 ? monthlyProgress / monthlyTarget : 0} />
          {streak > 0 && <Text style={styles.streakText}>🔥 {streak} month streak</Text>}
        </View>

        {/* Quarterly per-person */}
        <Text style={styles.sectionLabel}>This Quarter — Per Person</Text>
        {activeTargets.map((target) => {
          const qDefault = QUARTERLY_DEFAULTS[target.stage];
          const qProgress = getQuarterlyVerticalProgress(interactions, target.id, currentQuarter);
          const hit = qProgress >= qDefault;

          return (
            <View key={target.id} style={styles.quarterRow}>
              <View style={styles.quarterLeft}>
                <Text style={styles.quarterName}>{target.name}</Text>
                <StageBadge stage={target.stage} />
              </View>
              <View style={styles.quarterRight}>
                <Text style={[styles.quarterVal, { color: hit ? COLORS.textDim : STAGE_COLORS[target.stage].color }]}>
                  {qProgress} / {qDefault}
                </Text>
              </View>
            </View>
          );
        })}
        {activeTargets.length === 0 && <Text style={styles.emptyText}>No active targets</Text>}

        {/* Past months */}
        {sortedResults.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Past Months</Text>
            {sortedResults.map((result) => (
              <View key={result.month} style={styles.pastRow}>
                <Text style={styles.pastMonth}>{result.month}</Text>
                <Text style={[styles.pastResult, { color: result.hit ? COLORS.green : COLORS.accent }]}>
                  {result.actual} / {result.target} {result.hit ? '✓' : ''}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  backBtn: { fontSize: 17, color: COLORS.accent },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase',
  },
  card: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 20, marginBottom: 24 },
  monthlyRow: { flexDirection: 'row', alignItems: 'baseline' },
  bigNumber: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  bigTarget: { fontSize: 32, fontWeight: '300', color: COLORS.textDim },
  monthlyDesc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  streakText: { fontSize: 14, color: COLORS.gold, marginTop: 12 },
  quarterRow: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  quarterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quarterName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  quarterRight: {},
  quarterVal: { fontSize: 18, fontWeight: '700' },
  emptyText: { color: COLORS.textDim, fontSize: 14 },
  pastRow: {
    backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  pastMonth: { fontSize: 15, color: COLORS.text },
  pastResult: { fontSize: 15, fontWeight: '700' },
});
```

- [ ] **Step 2: Verify challenge detail screen**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: tapping challenge card on dashboard navigates to detail screen showing monthly progress, quarterly per-person breakdown, and past months.

- [ ] **Step 3: Commit**

```bash
cd /Users/spall03/brotation
git add src/screens/ChallengeDetailScreen.tsx
git commit -m "feat: build challenge detail screen — monthly, quarterly, history"
```

---

## Task 11: Notifications

**Files:**
- Create: `brotation/src/notifications.ts`
- Create: `brotation/__tests__/notifications.test.ts`
- Modify: `brotation/App.tsx`

- [ ] **Step 1: Write notification priority tests**

Create `brotation/__tests__/notifications.test.ts`:

```typescript
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
      makeInteraction('t1', 3),  // 3 days ago
      makeInteraction('t2', 14), // 14 days ago
    ];
    const nudge = pickNudge(targets, interactions, 3, 2);
    expect(nudge).toContain('Marcus');
  });

  it('nudges about monthly goal when behind', () => {
    const targets = [makeTarget('t1', 'Jake')];
    const interactions: Interaction[] = []; // no interactions this month
    const nudge = pickNudge(targets, interactions, 3, 0);
    expect(nudge).toBeTruthy();
  });

  it('returns null when all targets are on track', () => {
    const targets = [makeTarget('t1', 'Jake')];
    const interactions = [makeInteraction('t1', 1)]; // yesterday
    // monthlyTarget=1, monthlyProgress=1 -> on track
    const nudge = pickNudge(targets, interactions, 1, 1);
    expect(nudge).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/spall03/brotation
npx jest __tests__/notifications.test.ts
```

Expected: FAIL — cannot find module `../src/notifications`.

- [ ] **Step 3: Implement notifications.ts**

Create `brotation/src/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Target, Interaction } from './types';

export function pickNudge(
  targets: Target[],
  interactions: Interaction[],
  monthlyTarget: number,
  monthlyProgress: number,
): string | null {
  const activeTargets = targets.filter((t) => t.status === 'active');
  if (activeTargets.length === 0) return null;

  // Priority 1: behind on monthly goal
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthFraction = dayOfMonth / daysInMonth;

  if (monthlyProgress < monthlyTarget && monthFraction > 0.5) {
    const remaining = monthlyTarget - monthlyProgress;
    return `You're at ${monthlyProgress}/${monthlyTarget} this month — ${remaining} more to go!`;
  }

  // Priority 2: most stale active target
  const staleness = activeTargets.map((target) => {
    const targetInteractions = interactions.filter((i) => i.targetId === target.id);
    if (targetInteractions.length === 0) {
      return { target, daysSince: Infinity };
    }
    const latest = targetInteractions.sort((a, b) => b.date.localeCompare(a.date))[0];
    const daysSince = Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
    return { target, daysSince };
  }).sort((a, b) => b.daysSince - a.daysSince);

  const mostStale = staleness[0];
  if (mostStale.daysSince >= 7) {
    const firstName = mostStale.target.name.split(' ')[0];
    if (mostStale.daysSince === Infinity) {
      return `You haven't connected with ${firstName} yet. Send a text?`;
    }
    const weeks = Math.floor(mostStale.daysSince / 7);
    return `You haven't seen ${firstName} in ${weeks > 1 ? `${weeks} weeks` : 'a week'}. Text him?`;
  }

  // All on track
  return null;
}

export async function scheduleDailyNudge(nudgeMessage: string | null): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!nudgeMessage) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Brotation',
      body: nudgeMessage,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/spall03/brotation
npx jest __tests__/notifications.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Wire notifications into App.tsx**

In `brotation/App.tsx`, add notification setup inside the `App` component before the return:

```typescript
import { useEffect } from 'react';
import { getTargets, getInteractions } from './src/storage';
import { suggestMonthlyTarget, getMonthlyHorizontalProgress, getCurrentMonth } from './src/challenges';
import { pickNudge, scheduleDailyNudge, requestNotificationPermissions } from './src/notifications';

// Inside App():
useEffect(() => {
  async function setupNotifications() {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const [targets, interactions] = await Promise.all([getTargets(), getInteractions()]);
    const activeCount = targets.filter((t) => t.status === 'active').length;
    const monthlyTarget = suggestMonthlyTarget(activeCount);
    const monthlyProgress = getMonthlyHorizontalProgress(interactions, getCurrentMonth());
    const nudge = pickNudge(targets, interactions, monthlyTarget, monthlyProgress);
    await scheduleDailyNudge(nudge);
  }
  setupNotifications();
}, []);
```

- [ ] **Step 6: Commit**

```bash
cd /Users/spall03/brotation
git add src/notifications.ts __tests__/notifications.test.ts App.tsx
git commit -m "feat: add daily notification nudges with priority logic"
```

---

## Task 12: Graduation Celebration + Toast Integration

**Files:**
- Modify: `brotation/src/screens/LogInteractionScreen.tsx`
- Modify: `brotation/src/screens/DashboardScreen.tsx`
- Modify: `brotation/src/screens/PersonDetailScreen.tsx`

- [ ] **Step 1: Add toast state to DashboardScreen**

In `brotation/src/screens/DashboardScreen.tsx`, add toast state and the Toast component:

```typescript
import { Toast } from '../components/Toast';
```

Add state:

```typescript
const [toast, setToast] = useState<string | null>(null);
```

Add the Toast component just before the closing `</SafeAreaView>`:

```tsx
<Toast message={toast ?? ''} visible={!!toast} onHide={() => setToast(null)} />
```

- [ ] **Step 2: Pass toast callback via navigation params**

Update `RootStackParamList` in `brotation/App.tsx`:

```typescript
export type RootStackParamList = {
  Dashboard: { toast?: string } | undefined;
  PersonDetail: { targetId: string };
  ChallengeDetail: undefined;
  LogInteraction: { targetId?: string };
  ContactImport: undefined;
};
```

In DashboardScreen, read the toast param:

```typescript
useEffect(() => {
  if (route.params?.toast) {
    setToast(route.params.toast);
    // Clear the param so it doesn't re-trigger
    navigation.setParams({ toast: undefined });
  }
}, [route.params?.toast]);
```

- [ ] **Step 3: Update LogInteractionScreen to pass toast and detect graduation**

In `brotation/src/screens/LogInteractionScreen.tsx`, update the `goBack` function and `handleSave`:

In `handleSave`, after computing `newStage`, check for graduation:

```typescript
const graduated = newStage !== target.stage;
const stageLabel = newStage === 'bro' ? 'Bro 🔥' : newStage === 'building' ? 'Building 🤝' : '';
const toastMsg = graduated
  ? `${target.name.split(' ')[0]} leveled up to ${stageLabel}!`
  : `+${points} pts with ${target.name.split(' ')[0]}`;
```

Update the `goBack` calls to pass the toast:

```typescript
navigation.navigate('Dashboard', { toast: toastMsg });
```

- [ ] **Step 4: Update PersonDetailScreen quick log to show toast**

In `brotation/src/screens/PersonDetailScreen.tsx`, update `handleQuickLog` to navigate back with a toast when stage changes:

```typescript
const handleQuickLog = async (type: InteractionType) => {
  const points = POINTS[type];
  await saveInteraction({
    id: uuid(),
    targetId: target.id,
    type,
    points,
    date: new Date().toISOString(),
  });
  const newPoints = target.totalPoints + points;
  const newStage = getStageForPoints(newPoints);
  const graduated = newStage !== target.stage;
  await saveTarget({ ...target, totalPoints: newPoints, stage: newStage });

  if (graduated) {
    const stageLabel = newStage === 'bro' ? 'Bro 🔥' : 'Building 🤝';
    Alert.alert('Level Up!', `${target.name.split(' ')[0]} is now ${stageLabel}!`);
  }

  loadData();
};
```

- [ ] **Step 5: Verify toast and graduation flow**

```bash
cd /Users/spall03/brotation
npx expo start
```

Expected: logging an interaction shows a toast on the dashboard. If a stage threshold is crossed, a graduation message appears.

- [ ] **Step 6: Commit**

```bash
cd /Users/spall03/brotation
git add src/screens/DashboardScreen.tsx src/screens/LogInteractionScreen.tsx src/screens/PersonDetailScreen.tsx App.tsx
git commit -m "feat: add toast feedback and graduation celebration"
```

---

## Task 13: Monthly Rollover

**Files:**
- Modify: `brotation/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Add month rollover check to DashboardScreen**

At the end of the `loadData` callback in `DashboardScreen`, add logic to check if a new month has started and save the previous month's result:

```typescript
import { saveMonthlyResult } from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

After loading data, add:

```typescript
// Check for month rollover
const lastCheckedMonth = await AsyncStorage.getItem('brotation:lastCheckedMonth');
if (lastCheckedMonth && lastCheckedMonth !== currentMonth) {
  // Save result for the previous month
  const prevProgress = getMonthlyHorizontalProgress(i, lastCheckedMonth);
  const prevActiveCount = t.filter((x) => x.status === 'active').length;
  const prevTarget = suggestMonthlyTarget(prevActiveCount);
  await saveMonthlyResult({
    month: lastCheckedMonth,
    target: prevTarget,
    actual: prevProgress,
    hit: prevProgress >= prevTarget,
  });
  setMonthlyResults(await getMonthlyResults());
}
await AsyncStorage.setItem('brotation:lastCheckedMonth', currentMonth);
```

- [ ] **Step 2: Verify rollover logic**

This is hard to test in real time. Verify by temporarily changing `getCurrentMonth()` to return a past month, opening the app, then changing it back. The past month should appear in ChallengeDetailScreen's "Past Months" section.

- [ ] **Step 3: Commit**

```bash
cd /Users/spall03/brotation
git add src/screens/DashboardScreen.tsx
git commit -m "feat: add monthly challenge rollover and result tracking"
```

---

## Task 14: EAS Build + TestFlight Setup

**Files:**
- Modify: `brotation/app.json`
- Create: `brotation/eas.json`

- [ ] **Step 1: Install EAS CLI globally (if not already installed)**

```bash
npm install -g eas-cli
```

- [ ] **Step 2: Initialize EAS in the project**

```bash
cd /Users/spall03/brotation
eas init
```

This will create a project in Expo's dashboard and add the `projectId` to `app.json`.

- [ ] **Step 3: Update app.json for iOS build**

Update `brotation/app.json` to include iOS config:

```json
{
  "expo": {
    "name": "Brotation",
    "slug": "brotation",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "backgroundColor": "#131313"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.2ndstrike.brotation",
      "buildNumber": "1",
      "infoPlist": {
        "NSContactsUsageDescription": "Brotation uses your contacts to help you import friends to track."
      }
    },
    "plugins": [
      [
        "expo-contacts",
        {
          "contactsPermission": "Brotation uses your contacts to import friends."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png"
        }
      ]
    ]
  }
}
```

- [ ] **Step 4: Create eas.json build profiles**

Create `brotation/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "",
        "ascAppId": "",
        "appleTeamId": ""
      }
    }
  }
}
```

Note: `appleId`, `ascAppId`, and `appleTeamId` will be filled in during the first submit — EAS prompts for them interactively.

- [ ] **Step 5: Run EAS build for iOS (INTERACTIVE — user must run)**

The user runs this command themselves:

```bash
cd /Users/spall03/brotation
! eas build --platform ios --profile production
```

This will:
- Prompt for Apple Developer credentials
- Generate provisioning profiles
- Build the app in the cloud
- Return a build URL

- [ ] **Step 6: Submit to TestFlight (INTERACTIVE — user must run)**

After the build completes:

```bash
cd /Users/spall03/brotation
! eas submit --platform ios --latest
```

This will:
- Prompt for App Store Connect API key (or Apple ID)
- Upload the build to TestFlight
- The app will appear in TestFlight after Apple's processing (~5-15 min)

- [ ] **Step 7: Commit build config**

```bash
cd /Users/spall03/brotation
git add app.json eas.json
git commit -m "chore: add EAS build config for TestFlight deployment"
```

---

## Summary

| Task | What it builds |
|---|---|
| 1 | Project scaffold, types, constants |
| 2 | Storage module (AsyncStorage CRUD) |
| 3 | Challenge computation (monthly/quarterly/streaks/stages) |
| 4 | Navigation + Dashboard shell |
| 5 | ChallengeCard + ProgressBar + StageBadge |
| 6 | PersonCard + BenchSection |
| 7 | Log Interaction screen + Toast |
| 8 | Person Detail screen |
| 9 | Contact Import screen |
| 10 | Challenge Detail screen |
| 11 | Notifications |
| 12 | Graduation celebration + toast integration |
| 13 | Monthly rollover |
| 14 | EAS Build + TestFlight deployment |
