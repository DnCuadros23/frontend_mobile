import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from './ui';
import { colors, radius, spacing } from '../theme';

interface PlaceholderProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Rama responsable de implementar esta pantalla. */
  branch: string;
  description?: string;
}

/**
 * Pantalla base reutilizable para secciones aún no implementadas.
 * Cada rama de feature reemplaza el contenido manteniendo el esqueleto.
 */
export function Placeholder({ icon = 'construct-outline', title, branch, description }: PlaceholderProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
        <View style={styles.branchTag}>
          <Ionicons name="git-branch-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.branchText}>{branch}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  branchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.primaryDark}14`,
  },
  branchText: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
});
