import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { OfflineBanner } from '../components/OffLineBanner';

// Cambia a false para probar el flujo de login. Solo aplica en expo start, nunca en producción.
const DEV_SKIP_AUTH = true;

export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  // Mientras se restaura la sesión guardada, mostramos un loader.
  if (isBootstrapping) return <Loading message="Cargando SecureTrace..." />;

  const showApp = (DEV_SKIP_AUTH && __DEV__) || isAuthenticated;

  return (
  <NavigationContainer>
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      {showApp ? <AppTabs /> : <AuthStack />}
    </View>
  </NavigationContainer>
);
}
