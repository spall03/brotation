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
