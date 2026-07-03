import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CasesStackParamList } from './types';
import { colors } from '../theme';
import { CasesListScreen } from '../screens/cases/CasesListScreen';
import { CaseDetailScreen } from '../screens/cases/CaseDetailScreen';
import { CaseFormScreen } from '../screens/cases/CaseFormScreen';
import { useTheme } from '../contexts/ThemeContext'

const Stack = createNativeStackNavigator<CasesStackParamList>();

export function CasesStack() {
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
        name="CasesList"
        component={CasesListScreen}
        options={{ title: 'Casos' }}
      />
      <Stack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        options={{ title: 'Detalle del caso' }}
      />
      <Stack.Screen
        name="CaseForm"
        component={CaseFormScreen}
        options={{ title: 'Reportar caso' }}
      />
    </Stack.Navigator>
  );
}
