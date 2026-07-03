import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import { Placeholder } from '../../components/Placeholder';
import { Button, Card, Input, Screen } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { secureStorage } from '../../services/secureStorage';
import { getErrorMessage } from '../../utils/errorMessages';
import { colors, spacing, typography } from '../../theme';

import {
  requestPresignedUrl,
  uploadFileToS3,
  createEvidence,
} from '../../api/evidence';

import EvidenceList from '../../components/Evidence/EvidenceList';
import type { EvidenceType } from '../../types';


interface EvidenceScreenProps {
  route?: {
    params?: {
      caseId?: number;
    };
  };
}

interface LocalEvidenceFile {
  uri: string;
  originalName: string;
  contentType: string;
  type: EvidenceType;
  sizeBytes: number;
}

export function EvidenceScreen({ route }: EvidenceScreenProps) {
  const routeCaseId = route?.params?.caseId;

  const [draftCaseId, setDraftCaseId] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(
    routeCaseId ?? null,
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { showToast } = useToast();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const caseId = routeCaseId ?? selectedCaseId;

  async function getLocalFileSizeBytes(uri: string, fallbackSize = 0) {
  if (fallbackSize > 0) return fallbackSize;

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return blob.size;
  } catch {
    return 0;
  }
}

  function handleSelectManualCase() {
    const parsedCaseId = Number(draftCaseId);

    if (!Number.isInteger(parsedCaseId) || parsedCaseId <= 0) {
      Alert.alert('Dato inválido', 'Ingresa un ID de caso válido.');
      return;
    } 

    setSelectedCaseId(parsedCaseId);
  }

  async function pickImageFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'No se concedió permiso para acceder a la galería.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const sizeBytes = await getLocalFileSizeBytes(
        asset.uri,
        asset.fileSize ?? 0,
      );

      await uploadEvidence({
        uri: asset.uri,
        originalName: asset.fileName || `evidence-${Date.now()}.jpg`,
        contentType: asset.mimeType || 'image/jpeg',
        type: 'IMAGE',
        sizeBytes,
      });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'No se concedió permiso para usar la cámara.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const sizeBytes = await getLocalFileSizeBytes(
        asset.uri,
        asset.fileSize ?? 0,
      );

      await uploadEvidence({
        uri: asset.uri,
        originalName: asset.fileName || `photo-${Date.now()}.jpg`,
        contentType: asset.mimeType || 'image/jpeg',
        type: 'IMAGE',
        sizeBytes,
      });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  async function takeVideo() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'No se concedió permiso para usar la cámara.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const sizeBytes = await getLocalFileSizeBytes(
        asset.uri,
        asset.fileSize ?? 0,
      );

      await uploadEvidence({
        uri: asset.uri,
        originalName: asset.fileName || `video-${Date.now()}.mp4`,
        contentType: asset.mimeType || 'video/mp4',
        type: 'VIDEO',
        sizeBytes,
      });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  async function uploadEvidence(file: LocalEvidenceFile) {
    if (!caseId || Number.isNaN(caseId)) {
      Alert.alert(
        'Caso no encontrado',
        'Ingresa o selecciona un caso válido para registrar la evidencia.'
      );
      return;
    }

    try {
      setLoading(true);

      const user = await secureStorage.getUser();

      if (!user) {
        Alert.alert('Sesión expirada', 'Inicia sesión nuevamente.');
        return;
      }

      const presignedData = await requestPresignedUrl({
        originalName: file.originalName,
        contentType: file.contentType,
      });

      await uploadFileToS3(
        presignedData.presignedUrl,
        file.uri,
        file.contentType
      );

      await createEvidence({
        caseId,
        uploadedById: user.id,
        type: file.type,
        originalName: file.originalName,
        fileUrl: presignedData.fileUrl,
        fileKey: presignedData.fileKey,
        sizeBytes: file.sizeBytes,
        description: description.trim() || undefined,
      });

      setDescription('');
      setRefreshKey((currentValue) => currentValue + 1);

      showToast('La evidencia fue registrada correctamente.', 'success');
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function startAudioRecording() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso denegado', 'No se concedió permiso para usar el micrófono.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  async function stopAudioRecording() {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;
      const sizeBytes = await getLocalFileSizeBytes(uri);
      await uploadEvidence({
        uri,
        originalName: `audio-${Date.now()}.m4a`,
        contentType: 'audio/m4a',
        type: 'AUDIO',
        sizeBytes,
      });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  }

  if (!caseId) {
    return (
      <Screen scroll>
        <Placeholder
          icon="camera-outline"
          title="Capturar evidencia"
          description="Ingresa el ID de un caso para registrar evidencias mientras se conecta esta pantalla desde el detalle del caso."
          branch="feature/evidence-sensors"
        />

        <Card style={styles.card}>
          <Input
            label="ID del caso"
            value={draftCaseId}
            onChangeText={setDraftCaseId}
            placeholder="Ejemplo: 1"
            keyboardType="numeric"
          />

          <Button
            title="Continuar"
            onPress={handleSelectManualCase}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Capturar evidencia</Text>
      <Text style={styles.subtitle}>
        Caso #{caseId}
      </Text>

      <Card style={styles.card}>
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe brevemente la evidencia"
          multiline
          style={styles.descriptionInput}
        />

        {recorderState.isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>
              Grabando: {Math.floor(recorderState.durationMillis / 1000)}s
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={recorderState.isRecording ? 'Detener grabación' : 'Grabar audio'}
            variant={recorderState.isRecording ? 'danger' : 'secondary'}
            onPress={recorderState.isRecording ? stopAudioRecording : startAudioRecording}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Tomar foto"
            onPress={takePhoto}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Grabar Video"
            variant="secondary"
            onPress={takeVideo}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Seleccionar de galería"
            variant="secondary"
            onPress={pickImageFromGallery}
            loading={loading}
            disabled={loading}
          />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Evidencias registradas</Text>

      <EvidenceList caseId={caseId} refreshKey={refreshKey} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  recordingTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  descriptionInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
});