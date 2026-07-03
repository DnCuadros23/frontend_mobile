import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons
        name="cloud-offline-outline"
        size={18}
        color={colors.textInverse}
      />
      <Text style={styles.text}>
        Sin conexión. Algunas funciones pueden no estar disponibles.
      </Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    banner: {
        backgroundColor: colors.danger,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    text: {
        color: colors.textInverse,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
});}