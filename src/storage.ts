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
