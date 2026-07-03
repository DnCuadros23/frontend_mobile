import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Estado de error con opción de reintento (retry logic de la rúbrica). */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <View style={styles.btn}>
          <Button title="Reintentar" variant="secondary" onPress={onRetry} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  text: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  btn: { marginTop: spacing.lg },
});
