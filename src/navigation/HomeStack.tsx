import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { EmergencyMapScreen } from '../screens/EmergencyMapScreen';
import { useTheme } from '../contexts/ThemeContext'

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.navy,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EmergencyMap"
        component={EmergencyMapScreen}
        options={{ title: 'Comisarías cercanas' }}
      />
    </Stack.Navigator>
  );
}
