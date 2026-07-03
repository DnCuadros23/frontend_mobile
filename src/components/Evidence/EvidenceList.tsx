import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { evidenceApi } from '../../api/evidence';
import { Card, EmptyState, ErrorState, Loading } from '../ui';
import { useApi } from '../../hooks/useApi';
import { colors, spacing, typography } from '../../theme';
import type { Evidence } from '../../types';

interface EvidenceListProps {
  caseId: number;
  refreshKey?: number;
}

const TYPE_LABEL: Record<string, string> = {
  IMAGE: 'Imagen',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  DOCUMENT: 'Documento',
  OTHER: 'Otro',
};

function EvidenceList({ caseId, refreshKey = 0 }: EvidenceListProps) {
  const { data, loading, error, refetch } = useApi<Evidence[]>(
    () => evidenceApi.byCase(caseId),
    [caseId, refreshKey],
  );

  if (loading) {
    return <Loading message="Cargando evidencias..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const evidenceList = data ?? [];

  if (evidenceList.length === 0) {
    return (
      <EmptyState
        icon="images-outline"
        title="Sin evidencias"
        description="Todavía no hay evidencias registradas para este caso."
      />
    );
  }

  return (
    <View style={styles.container}>
      {evidenceList.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => Linking.openURL(item.fileUrl)}
        >
          <Card style={styles.card}>
            <View style={styles.row}>
              <Ionicons
                name={getEvidenceIcon(item.type)}
                size={26}
                color={colors.primary}
              />

              <View style={styles.content}>
                <Text style={styles.name}>{item.originalName}</Text>

                <Text style={styles.meta}>
                  {TYPE_LABEL[item.type] ?? item.type}
                  {item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ''}
                </Text>

                {!!item.description && (
                  <Text style={styles.description}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function getEvidenceIcon(type: Evidence['type']) {
  switch (type) {
    case 'IMAGE':
      return 'image-outline';
    case 'VIDEO':
      return 'videocam-outline';
    case 'AUDIO':
      return 'mic-outline';
    case 'DOCUMENT':
      return 'document-text-outline';
    default:
      return 'attach-outline';
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  description: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
});

export default EvidenceList;