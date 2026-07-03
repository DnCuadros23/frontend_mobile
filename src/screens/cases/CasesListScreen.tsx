import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, EmptyState, ErrorState, PriorityBadge, StatusBadge } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { casesApi } from '../../api/cases';
import { colors, radius, spacing } from '../../theme';
import type { Case } from '../../types';
import type { CasesStackParamList } from '../../navigation/types';
import { ListSkeleton } from '../../components/ui/Skeleton';

type Props = NativeStackScreenProps<CasesStackParamList, 'CasesList'>;

export function CasesListScreen({ navigation }: Props) {
  const { data, loading, error, refetch } = useApi(() => casesApi.list({ page: 0, size: 20 }));

  // Refresca al volver a la pestaña.
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));

  if (loading && !data) {
  return (
    <View style={styles.container}>
      <View style={styles.list}>
        <ListSkeleton count={5} />
      </View>
    </View>
  );
}
  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;

  const cases = data?.content ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={cases}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No hay casos aún"
            description="Reporta tu primer caso con el botón +."
          />
        }
        renderItem={({ item }: { item: Case }) => (
          <Pressable onPress={() => navigation.navigate('CaseDetail', { id: item.id })}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <PriorityBadge priority={item.priority} />
              </View>
              {!!item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={styles.cardFooter}>
                <StatusBadge status={item.status} />
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CaseForm')}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.textMuted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  date: { fontSize: 12, color: colors.textMuted },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
