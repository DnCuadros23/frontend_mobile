import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { AppTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { CasesStack } from './CasesStack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { STAssistantScreen } from '../screens/assistant/STAssistantScreen';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home:      'home',
  Cases:     'folder',
  Assistant: 'chatbubble-ellipses',
  Profile:   'person',
};

const LABELS: Record<keyof AppTabParamList, string> = {
  Home:      'Inicio',
  Cases:     'Casos',
  Assistant: 'ST Assistant',
  Profile:   'Perfil',
};

export function AppTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home"      component={HomeStack}        options={{ title: LABELS.Home      }} />
      <Tab.Screen name="Cases"     component={CasesStack}       options={{ title: LABELS.Cases     }} />
      <Tab.Screen name="Assistant" component={STAssistantScreen} options={{ title: LABELS.Assistant }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}    options={{ title: LABELS.Profile   }} />
    </Tab.Navigator>
  );
}