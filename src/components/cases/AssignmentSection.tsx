import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { assignmentsApi } from '../../api/assignments';
import { Card, ConfirmModal } from '../ui';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { colors, radius, spacing } from '../../theme';
import type { Assignment } from '../../types';

interface Props {
  caseId: number;
}

export function AssignmentSection({ caseId }: Props) {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [specialistId, setSpecialistId] = useState('');
  const [adding, setAdding] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Assignment | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assignmentsApi.byCase(caseId);
      setAssignments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    const id = parseInt(specialistId, 10);
    if (!id || !user) return;
    setAdding(true);
    try {
      const a = await assignmentsApi.create({
        caseId,
        specialistId: id,
        assignedById: user.id,
      });
      setAssignments((prev) => [...prev, a]);
      setSpecialistId('');
      setShowAdd(false);
      showToast('Especialista asignado', 'success');
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        showToast('Ese especialista ya está asignado', 'error');
      } else {
        showToast('No se pudo asignar el especialista', 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const updated = await assignmentsApi.deactivate(deactivateTarget.id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setDeactivateTarget(null);
      showToast('Asignación desactivada', 'success');
    } catch {
      showToast('No se pudo desactivar la asignación', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const active = assignments.filter((a) => a.active);
  const inactive = assignments.filter((a) => !a.active);

  // Ocultar sección para no-admin si no hay asignaciones
  if (!isAdmin && assignments.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Asignaciones</Text>
        {isAdmin && (
          <Pressable
            onPress={() => setShowAdd((v) => !v)}
            style={styles.addIconBtn}
            accessibilityLabel="Asignar especialista"
          >
            <Ionicons
              name={showAdd ? 'close' : 'person-add-outline'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>

      {isAdmin && showAdd && (
        <Card style={styles.addCard}>
          <Text style={styles.addLabel}>ID del especialista</Text>
          <View style={styles.addRow}>
            <TextInput
              value={specialistId}
              onChangeText={setSpecialistId}
              keyboardType="numeric"
              placeholder="Ej: 5"
              placeholderTextColor={colors.textMuted}
              style={styles.addInput}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!specialistId.trim() || adding}
              style={[
                styles.addConfirm,
                (!specialistId.trim() || adding) && styles.addConfirmDisabled,
              ]}
            >
              {adding ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color={colors.textInverse} />
              )}
            </Pressable>
          </View>
        </Card>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : active.length === 0 && inactive.length === 0 ? (
        <Text style={styles.emptyText}>Sin asignaciones. {isAdmin ? 'Usa el botón + para asignar.' : ''}</Text>
      ) : (
        <>
          {active.map((a) => (
            <Card key={a.id} style={styles.assignCard}>
              <View style={styles.assignRow}>
                <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
                <View style={styles.assignInfo}>
                  <Text style={styles.assignName}>
                    {a.specialistName ?? `Especialista #${a.specialistId}`}
                  </Text>
                  <Text style={styles.assignDate}>
                    Asignado {new Date(a.assignedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeActiveText}>Activo</Text>
                </View>
                {isAdmin && (
                  <Pressable
                    onPress={() => setDeactivateTarget(a)}
                    hitSlop={8}
                    style={styles.deactivateBtn}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            </Card>
          ))}
          {inactive.map((a) => (
            <Card key={a.id} style={[styles.assignCard, styles.assignCardInactive]}>
              <View style={styles.assignRow}>
                <Ionicons name="person-circle-outline" size={30} color={colors.textMuted} />
                <View style={styles.assignInfo}>
                  <Text style={[styles.assignName, { color: colors.textMuted }]}>
                    {a.specialistName ?? `Especialista #${a.specialistId}`}
                  </Text>
                  <Text style={styles.assignDate}>
                    Asignado {new Date(a.assignedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.badge, styles.badgeInactive]}>
                  <Text style={styles.badgeInactiveText}>Inactivo</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      <ConfirmModal
        visible={!!deactivateTarget}
        title="Desactivar asignación"
        message={`¿Desactivar a ${deactivateTarget?.specialistName ?? `Especialista #${deactivateTarget?.specialistId}`}? El especialista perderá acceso activo al caso.`}
        confirmLabel="Desactivar"
        destructive
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addIconBtn: { padding: spacing.xs },

  addCard: { margin: spacing.md, marginTop: spacing.sm },
  addLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  addConfirm: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmDisabled: { backgroundColor: colors.border },

  emptyText: { fontSize: 13, color: colors.textMuted, padding: spacing.lg },

  assignCard: { margin: spacing.md, marginTop: spacing.sm, marginBottom: 0 },
  assignCardInactive: { opacity: 0.6 },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assignInfo: { flex: 1 },
  assignName: { fontSize: 14, fontWeight: '600', color: colors.text },
  assignDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deactivateBtn: { padding: spacing.xs },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeActiveText: { fontSize: 11, fontWeight: '700', color: colors.success },
  badgeInactive: { backgroundColor: colors.background },
  badgeInactiveText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
});
