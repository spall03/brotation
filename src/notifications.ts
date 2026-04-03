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

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthFraction = dayOfMonth / daysInMonth;

  if (monthlyProgress < monthlyTarget && monthFraction > 0.5) {
    const remaining = monthlyTarget - monthlyProgress;
    return `You're at ${monthlyProgress}/${monthlyTarget} this month — ${remaining} more to go!`;
  }

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

  return null;
}

export async function scheduleDailyNudge(nudgeMessage: string | null): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!nudgeMessage) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Brotation', body: nudgeMessage },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
