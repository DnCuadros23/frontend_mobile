import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { casesApi } from '../../api/cases';
import { Card, ConfirmModal, ErrorState, Loading, PriorityBadge, StatusBadge, Button } from '../../components/ui';
import { MessageThread } from '../../components/cases/MessageThread';
import { AssignmentSection } from '../../components/cases/AssignmentSection';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { colors, spacing } from '../../theme';
import type { Case } from '../../types';
import type { CasesStackParamList } from '../../navigation/types';
import EvidenceList from '../../components/Evidence/EvidenceList'

type Props = NativeStackScreenProps<CasesStackParamList, 'CaseDetail'>;

export function CaseDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SPECIALIST' || caseData?.victimId === user?.id;

  useEffect(() => {
    setLoading(true);
    casesApi
      .get(id)
      .then((c) => {
        setCaseData(c);
        navigation.setOptions({ title: c.title });
      })
      .catch(() => setError('No se pudo cargar el caso'))
      .finally(() => setLoading(false));
  }, [id, navigation]);

  const handleDelete = async () => {
    if (!caseData) return;
    setDeleting(true);
    try {
      await casesApi.remove(caseData.id);
      showToast('Caso eliminado', 'success');
      navigation.goBack();
    } catch {
      showToast('No se pudo eliminar el caso', 'error');
      setDeleting(false);
    }
  };

  if (loading) return <Loading message="Cargando caso..." />;
  if (error || !caseData) {
    return (
      <ErrorState
        message={error ?? 'Caso no encontrado'}
        onRetry={() => {
          setError(null);
          setLoading(true);
          casesApi
            .get(id)
            .then((c) => { setCaseData(c); navigation.setOptions({ title: c.title }); })
            .catch(() => setError('No se pudo cargar el caso'))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  const goToEvidence = () => {
    showToast('Usa los botones de la pantalla Inicio para capturar evidencia.', 'info');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Acciones: editar y eliminar */}
      {canEdit && (
        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => navigation.navigate('CaseForm', { id: caseData.id })}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Editar</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => setShowDelete(true)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Eliminar</Text>
          </Pressable>
        </View>
      )}

      {/* Info del caso */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Estado</Text>
            <StatusBadge status={caseData.status} />
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Prioridad</Text>
            <PriorityBadge priority={caseData.priority} />
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Creado</Text>
            <Text style={styles.infoValue}>
              {new Date(caseData.createdAt).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          {caseData.updatedAt && (
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Actualizado</Text>
              <Text style={styles.infoValue}>
                {new Date(caseData.updatedAt).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
        {!!caseData.description && (
          <View style={styles.descWrapper}>
            <Text style={styles.infoLabel}>Descripción</Text>
            <Text style={styles.description}>{caseData.description}</Text>
          </View>
        )}
      </Card>

      {/* Mensajes */}
      <MessageThread caseId={caseData.id} />

      {/* Asignaciones */}
      <AssignmentSection caseId={caseData.id} />

      <Text style={styles.sectionTitle}>Evidencias</Text>
      <EvidenceList caseId={caseData.id}/>
      <Button
        title="Agregar evidencia"
        onPress={goToEvidence}
        variant="secondary"
      />

      <ConfirmModal
        visible={showDelete}
        title="Eliminar caso"
        message={`¿Estás seguro de que quieres eliminar "${caseData.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnDanger: { borderColor: colors.danger },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  infoCard: { gap: spacing.md },
  infoRow: { flexDirection: 'row', gap: spacing.lg },
  infoCell: { flex: 1, gap: spacing.xs },
  infoLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: colors.text },
  descWrapper: { gap: spacing.xs },
  description: { fontSize: 14, color: colors.text, lineHeight: 21 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md,
},
});
