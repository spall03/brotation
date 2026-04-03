import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PersonDetailScreen } from './src/screens/PersonDetailScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { LogInteractionScreen } from './src/screens/LogInteractionScreen';
import { ContactImportScreen } from './src/screens/ContactImportScreen';
import { COLORS } from './src/constants';
import { getTargets, getInteractions } from './src/storage';
import { suggestMonthlyTarget, getMonthlyHorizontalProgress, getCurrentMonth } from './src/challenges';
import { pickNudge, scheduleDailyNudge, requestNotificationPermissions } from './src/notifications';

export type RootStackParamList = {
  Dashboard: undefined;
  PersonDetail: { targetId: string };
  ChallengeDetail: undefined;
  LogInteraction: { targetId?: string };
  ContactImport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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
        <Stack.Screen name="ContactImport" component={ContactImportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
