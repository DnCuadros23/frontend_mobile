import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { casesApi } from '../../api/cases';
import { Button, Input, Loading, Textarea, Select } from '../../components/ui';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { colors, spacing } from '../../theme';
import type { Priority } from '../../types';
import type { CasesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CasesStackParamList, 'CaseForm'>;

const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Baja', value: 'LOW' },
  { label: 'Media', value: 'MEDIUM' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Crítica', value: 'CRITICAL' },
];

export function CaseFormScreen({ route, navigation }: Props) {
  const editing = !!route.params?.id;
  const caseId = route.params?.id;
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [loadingCase, setLoadingCase] = useState(editing);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar caso' : 'Reportar caso' });
  }, [editing, navigation]);

  useEffect(() => {
    if (!editing || !caseId) return;
    setLoadingCase(true);
    casesApi
      .get(caseId)
      .then((c) => {
        setTitle(c.title);
        setDescription(c.description ?? '');
        setPriority(c.priority);
      })
      .catch(() => showToast('No se pudo cargar el caso', 'error'))
      .finally(() => setLoadingCase(false));
  }, [caseId, editing, showToast]);

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    try {
      if (editing && caseId) {
        await casesApi.update(caseId, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
        });
        showToast('Caso actualizado', 'success');
        navigation.goBack();
      } else {
        const created = await casesApi.create({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          victimId: user.id,
        });
        showToast('Caso creado', 'success');
        navigation.replace('CaseDetail', { id: created.id });
      }
    } catch {
      showToast('No se pudo guardar el caso', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCase) return <Loading message="Cargando caso..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Título *"
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Agresión en vía pública"
        maxLength={120}
        error={title.length > 0 && !title.trim() ? 'El título es requerido' : null}
      />

      <Textarea
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe lo ocurrido con el mayor detalle posible..."
        maxLength={1000}
      />
      
      <Select
        label="Prioridad"
        value={priority}
        options={PRIORITY_OPTIONS}
        onChange={setPriority}
      />

      <Button
        title={editing ? 'Guardar cambios' : 'Crear caso'}
        onPress={handleSave}
        loading={saving}
        disabled={!title.trim() || saving}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  submitBtn: { marginTop: spacing.sm },
});
