export enum SchedulableTriggerInputTypes {
  DAILY = 'daily',
}

export const cancelAllScheduledNotificationsAsync = jest.fn().mockResolvedValue(undefined);
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock-notification-id');
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
