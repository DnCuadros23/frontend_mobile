import React, { useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, PriorityBadge, StatusBadge } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { Coordinates } from '../hooks/useLocation';
import { useToast } from '../contexts/ToastContext';
import { casesApi } from '../api/cases';
import { radius, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { emergencyContactsStorage } from '../services/emergencyContactsStorage';
import type { CaseStatus, Priority } from '../types';
import type { AppTabParamList, HomeStackParamList } from '../navigation/types';

type HomeNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<AppTabParamList>
>;

const STAT_CARDS: { key: CaseStatus; label: string }[] = [
  { key: 'OPEN',                label: 'Abiertos'   },
  { key: 'UNDER_INVESTIGATION', label: 'En revisión'},
  { key: 'CLOSED',              label: 'Resueltos'  },
  { key: 'ARCHIVED',            label: 'Archivados' },
];

const PRIORITY_CARDS: { key: Priority; label: string }[] = [
  { key: 'CRITICAL', label: 'Crítica' },
  { key: 'HIGH',     label: 'Alta'    },
  { key: 'MEDIUM',   label: 'Media'   },
  { key: 'LOW',      label: 'Baja'    },
];

const RECENT_CASES_SIZE = 5;

// ─── Quick actions ──────────────────────────────────────────────────────────

type QuickActionKey = 'audio' | 'photo' | 'video' | 'text' | 'file';

const QUICK_ACTIONS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  actionKey: QuickActionKey;
}[] = [
  { icon: 'mic',           label: 'Audio',   actionKey: 'audio' },
  { icon: 'camera',        label: 'Foto',    actionKey: 'photo' },
  { icon: 'videocam',      label: 'Video',   actionKey: 'video' },
  { icon: 'document-text', label: 'Texto',   actionKey: 'text'  },
  { icon: 'attach',        label: 'Archivo', actionKey: 'file'  },
];

// ─── Audio recorder mini-modal ──────────────────────────────────────────────

function AudioModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    await recording.stopAndUnloadAsync();
    setRecording(null);
    setRecorded(true);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(null);
    setRecorded(false);
    setDuration(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 28, margin: 16, alignItems: 'center', gap: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Grabación de audio</Text>

          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: recording ? colors.danger + '20' : colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="mic" size={36} color={recording ? colors.danger : colors.primary} />
          </View>

          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>
            {fmt(duration)}
          </Text>

          {recorded && (
            <Text style={{ fontSize: 13, color: colors.success, fontWeight: '600' }}>
              ✓ Audio guardado correctamente
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            {!recording && !recorded && (
              <Pressable onPress={startRecording} style={{ flex: 1, backgroundColor: colors.danger, borderRadius: 12, padding: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Grabar</Text>
              </Pressable>
            )}
            {recording && (
              <Pressable onPress={stopRecording} style={{ flex: 1, backgroundColor: colors.navy, borderRadius: 12, padding: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Detener</Text>
              </Pressable>
            )}
            <Pressable onPress={handleClose} style={{ flex: 1, backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Text note mini-modal ───────────────────────────────────────────────────

function TextNoteModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [note, setNote] = useState('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const handleSave = () => {
    if (!note.trim()) { Alert.alert('Escribe algo antes de guardar.'); return; }
    Alert.alert('Apunte guardado', 'Tu nota fue registrada correctamente.');
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24, margin: 16, gap: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Nuevo apunte</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Fecha</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 }}>{dateStr}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Hora</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 }}>{timeStr}</Text>
            </View>
          </View>
          {/* RN TextInput real */}
          <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 14, minHeight: 120, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 14, color: note ? colors.text : colors.textMuted }}>
              {note || 'Describe lo que observas…'}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
            Toca el área de texto para escribir tu apunte
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={handleSave} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── SOS modal con dos opciones ─────────────────────────────────────────────

function SOSModal({
  visible,
  loading,
  onCallPolice,
  onSendMessage,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onCallPolice: () => void;
  onSendMessage: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="warning" size={28} color={colors.danger} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              Activar emergencia
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
              ¿Qué acción quieres tomar?
            </Text>
          </View>

          <Pressable
            onPress={onCallPolice}
            disabled={loading}
            style={{ backgroundColor: colors.danger, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Ionicons name="call" size={22} color="#fff" />
            <View>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Llamar a la policía</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Llamada directa al 105</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onSendMessage}
            disabled={loading}
            style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Ionicons name="send" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Enviar alerta a contactos</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                Mensaje automático con tu ubicación exacta
              </Text>
            </View>
            {loading && <Ionicons name="hourglass" size={16} color="rgba(255,255,255,0.6)" />}
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={{ padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 14 }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── HomeScreen ─────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const statusCardColor: Record<CaseStatus, string> = {
    OPEN:                 colors.primary,
    UNDER_INVESTIGATION:  colors.warning,
    CLOSED:               colors.success,
    ARCHIVED:             colors.textMuted,
  };

  const dynamicPriorityColor = {
    LOW:      colors.textMuted,
    MEDIUM:   colors.primary,
    HIGH:     colors.warning,
    CRITICAL: colors.danger,
  };

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation<HomeNavProp>();

  const { data: stats, loading, refetch }           = useApi(() => casesApi.statistics());
  const { data: recent, refetch: refetchRecent }    = useApi(() =>
    casesApi.list({ page: 0, size: RECENT_CASES_SIZE }),
  );

  const [sosVisible, setSosVisible]         = useState(false);
  const [audioVisible, setAudioVisible]     = useState(false);
  const [textVisible, setTextVisible]       = useState(false);
  const [sosSubmitting, setSosSubmitting]   = useState(false);
  const sosCoordinatesRef                   = useRef<Coordinates | null>(null);

  // ─── Obtener ubicación ──────────────────────────────────────────────────
  async function resolveLocation(): Promise<Coordinates | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  }

  // ─── Llamar a policía ───────────────────────────────────────────────────
  async function handleCallPolice() {
    setSosVisible(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    void Linking.openURL('tel:947359476');
  }

  // ─── Enviar SMS a contactos de emergencia ──────────────────────────────
  async function handleSendMessage() {
    setSosVisible(false);
    setSosSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const allContacts = await emergencyContactsStorage.getAll();
    const active = allContacts.filter((c): c is NonNullable<typeof c> => c !== null);

    if (active.length === 0) {
      setSosSubmitting(false);
      Alert.alert(
        'Sin contactos de emergencia',
        'Ve a tu Perfil → Contactos de emergencia y agrega al menos uno para usar esta función.',
      );
      return;
    }

    const coords = await resolveLocation();
    sosCoordinatesRef.current = coords;

    const locationText = coords
      ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
      : 'ubicación no disponible';

    const body = encodeURIComponent(
      `🚨 Estoy en peligro, mi ubicación exacta es esta: ${locationText}`,
    );

    // sms: scheme — iOS usa &body=, Android usa ?body=
    const phones = active.map((c) => c.phone).join(',');
    const sep = Platform.OS === 'ios' ? '&' : '?';
    void Linking.openURL(`sms:${phones}${sep}body=${body}`);

    // Registrar caso SOS en el backend
    try {
      await casesApi.create({
        title: 'Alerta SOS',
        description: 'Alerta de emergencia. SMS enviado a contactos de emergencia.',
        priority: 'CRITICAL',
        victimId: user?.id ?? 0,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      showToast(`SMS preparado para ${active.length} contacto(s).`, 'success');
      if (coords) {
        navigation.navigate('EmergencyMap', { latitude: coords.latitude, longitude: coords.longitude });
      }
    } catch {
      showToast('SMS preparado. No se pudo registrar el caso en el servidor.', 'info');
    } finally {
      setSosSubmitting(false);
    }
  }

  // ─── Acciones rápidas ───────────────────────────────────────────────────
  async function handleQuickAction(actionKey: QuickActionKey) {
    switch (actionKey) {
      case 'audio':
        setAudioVisible(true);
        break;

      case 'photo': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Se necesita acceso a la cámara.'); return; }
        await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
        showToast('Foto capturada correctamente.', 'success');
        break;
      }

      case 'video': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Se necesita acceso a la cámara.'); return; }
        await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, videoMaxDuration: 120 });
        showToast('Video grabado correctamente.', 'success');
        break;
      }

      case 'text':
        setTextVisible(true);
        break;

      case 'file': {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled) {
          showToast('Archivo adjuntado correctamente.', 'success');
        }
        break;
      }
    }
  }

  const recentCases = recent?.content ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <Ionicons name="shield-checkmark" size={22} color={colors.textInverse} />
          <Text style={styles.brandText}>Secure Trace</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.textInverse} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => { void refetch(); void refetchRecent(); }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'Usuario'}</Text>
        <Text style={styles.subtitle}>¿En qué podemos ayudarte?</Text>

        {/* SOS button */}
        <View style={styles.sosContainer}>
          <View style={styles.sosRingOuter} />
          <View style={styles.sosRingInner} />
          <View style={styles.sosButtonOffset}>
            <Pressable
              onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setSosVisible(true);
              }}
              style={({ pressed }) => [styles.sos, pressed && styles.sosPressed]}
              accessibilityRole="button"
              accessibilityLabel="Botón de emergencia SOS"
            >
              <Ionicons name="shield-checkmark" size={34} color={colors.textInverse} />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSub}>Emergencia</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.sosHint}>Presiona para alertar al centro de control</Text>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Capturar evidencia</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              onPress={() => handleQuickAction(a.actionKey)}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name={a.icon} size={26} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Case summary */}
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Resumen de casos</Text>
          <Pressable onPress={() => navigation.navigate('Cases')}>
            <Text style={styles.link}>Ver todos</Text>
          </Pressable>
        </View>
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((c) => (
            <Card key={c.key} style={styles.statCard}>
              <Text style={[styles.statValue, { color: statusCardColor[c.key] }]}>
                {loading ? '—' : stats?.byStatus?.[c.key] ?? 0}
              </Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </Card>
          ))}
        </View>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Casos totales</Text>
          <Text style={styles.totalValue}>{loading ? '—' : stats?.totalCases ?? 0}</Text>
        </Card>

        {/* Priority */}
        <Text style={styles.sectionTitle}>Por prioridad</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_CARDS.map((p) => (
            <Card key={p.key} style={styles.priorityCard}>
              <View style={[styles.priorityDot, { backgroundColor: dynamicPriorityColor[p.key] }]} />
              <Text style={styles.priorityValue}>
                {loading ? '—' : stats?.byPriority?.[p.key] ?? 0}
              </Text>
              <Text style={styles.priorityLabel}>{p.label}</Text>
            </Card>
          ))}
        </View>

        {/* Recent cases */}
        <Text style={styles.sectionTitle}>Casos recientes</Text>
        {recentCases.length === 0 ? (
          <Card>
            <EmptyState
              icon="folder-open-outline"
              title="Sin casos recientes"
              description="Cuando reportes un caso aparecerá aquí."
            />
          </Card>
        ) : (
          <View style={styles.recentList}>
            {recentCases.map((c) => (
              <Pressable key={c.id} onPress={() => navigation.navigate('Cases')}>
                <Card style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{c.title}</Text>
                    <PriorityBadge priority={c.priority} />
                  </View>
                  <View style={styles.recentFooter}>
                    <StatusBadge status={c.status} />
                    <Text style={styles.recentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <SOSModal
        visible={sosVisible}
        loading={sosSubmitting}
        onCallPolice={handleCallPolice}
        onSendMessage={handleSendMessage}
        onCancel={() => setSosVisible(false)}
      />
      <AudioModal visible={audioVisible} onClose={() => setAudioVisible(false)} />
      <TextNoteModal visible={textVisible} onClose={() => setTextVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe:            { flex: 1, backgroundColor: colors.background },
    topbar:          { backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    brand:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    brandText:       { color: colors.textInverse, fontSize: 16, fontWeight: '700' },
    content:         { padding: spacing.lg, paddingBottom: spacing.xxl },
    greeting:        { fontSize: 24, fontWeight: '700', color: colors.text },
    subtitle:        { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
    sosContainer:    { alignSelf: 'center', width: 230, height: 230, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
    sosRingOuter:    { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.dangerSofter },
    sosRingInner:    { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: colors.dangerSoft },
    sosButtonOffset: { alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -12 }] },
    sos:             { alignSelf: 'center', width: 180, height: 180, borderRadius: 90, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, shadowColor: colors.danger, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
    sosPressed:      { opacity: 0.85, transform: [{ scale: 0.97 }] },
    sosText:         { color: colors.textInverse, fontSize: 36, fontWeight: '800', letterSpacing: 2 },
    sosSub:          { color: colors.textInverse, fontSize: 13, opacity: 0.9 },
    sosHint:         { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: spacing.md },
    sectionTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
    actionsRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    action:          { alignItems: 'center', justifyContent: 'center', flex: 1 },
    actionPressed:   { opacity: 0.75, transform: [{ scale: 0.97 }] },
    actionIconBox:   { width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    actionLabel:     { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted, fontWeight: '500', textAlign: 'center' },
    statsHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    link:            { color: colors.primary, fontWeight: '600', fontSize: 14, marginTop: spacing.xl },
    statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    statCard:        { width: '47%', alignItems: 'flex-start' },
    statValue:       { fontSize: 28, fontWeight: '800' },
    statLabel:       { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
    totalCard:       { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.navy, borderColor: colors.navy },
    totalLabel:      { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
    totalValue:      { color: colors.textInverse, fontSize: 28, fontWeight: '800' },
    priorityRow:     { flexDirection: 'row', gap: spacing.sm },
    priorityCard:    { flex: 1, alignItems: 'flex-start', paddingVertical: spacing.md },
    priorityDot:     { width: 10, height: 10, borderRadius: radius.full, marginBottom: spacing.sm },
    priorityValue:   { fontSize: 22, fontWeight: '800', color: colors.text },
    priorityLabel:   { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
    recentList:      { gap: spacing.md },
    recentCard:      { gap: spacing.sm },
    recentHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    recentTitle:     { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
    recentFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    recentDate:      { fontSize: 12, color: colors.textMuted },
  });
}