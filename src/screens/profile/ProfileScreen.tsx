import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, RoleBadge, ConfirmModal, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext'
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../utils/errorMessages';
import { radius, spacing, type ThemeColors } from '../../theme';
import type { UpdateProfileRequest } from '../../types';
import {
  emergencyContactsStorage,
  type EmergencyContact,
} from '../../services/emergencyContactsStorage';

type ActiveModal = 'none' | 'editProfile' | 'changePassword' | 'editContact';

const PHONE_RE = /^[+\d\s\-().]{6,20}$/;

interface ContactModalState {
  index: 0 | 1 | 2;
  name: string;
  phone: string;
  errors: Record<string, string>;
  saving: boolean;
}

export function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const {
    themeName,
    themeMode,
    colors,
    toggleThemeName,
    toggleThemeMode,
  } = useTheme();

  const styles = createStyles(colors);

  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Edit profile form
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', alias: '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);

  // Change password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);

  // Emergency contacts
  const [contacts, setContacts] = useState<(EmergencyContact | null)[]>([null, null, null]);
  const [contactModal, setContactModal] = useState<ContactModalState>({
    index: 0,
    name: '',
    phone: '',
    errors: {},
    saving: false,
  });

  useEffect(() => {
    emergencyContactsStorage.getAll().then(setContacts);
  }, []);

  const openContactModal = useCallback((index: 0 | 1 | 2) => {
    const existing = contacts[index];
    setContactModal({
      index,
      name: existing?.name ?? '',
      phone: existing?.phone ?? '',
      errors: {},
      saving: false,
    });
    setActiveModal('editContact');
  }, [contacts]);

  function setContactField(field: 'name' | 'phone', value: string) {
    setContactModal((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' },
    }));
  }

  async function handleSaveContact() {
    const errors: Record<string, string> = {};
    if (!contactModal.name.trim()) errors.name = 'El nombre es obligatorio.';
    if (!contactModal.phone.trim()) errors.phone = 'El teléfono es obligatorio.';
    else if (!PHONE_RE.test(contactModal.phone)) errors.phone = 'Formato de teléfono inválido.';
    if (Object.keys(errors).length) {
      setContactModal((prev) => ({ ...prev, errors }));
      return;
    }
    setContactModal((prev) => ({ ...prev, saving: true }));
    try {
      await emergencyContactsStorage.setContact(contactModal.index, {
        name: contactModal.name,
        phone: contactModal.phone,
      });
      const updated = await emergencyContactsStorage.getAll();
      setContacts(updated);
      showToast('Contacto de emergencia guardado.', 'success');
      closeModal();
    } catch {
      showToast('No se pudo guardar el contacto.', 'error');
      setContactModal((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleDeleteContact(index: 0 | 1 | 2) {
    Alert.alert(
      'Eliminar contacto',
      '¿Seguro que deseas eliminar este contacto de emergencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await emergencyContactsStorage.removeContact(index);
            const updated = await emergencyContactsStorage.getAll();
            setContacts(updated);
            showToast('Contacto eliminado.', 'success');
          },
        },
      ],
    );
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  function openEditProfile() {
    setProfileForm({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      alias: user?.alias ?? '',
    });
    setProfileErrors({});
    setActiveModal('editProfile');
  }

  function openChangePassword() {
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwErrors({});
    setActiveModal('changePassword');
  }

  function closeModal() {
    setActiveModal('none');
  }

  function setProfileField(field: keyof typeof profileForm, value: string) {
    setProfileForm((p) => ({ ...p, [field]: value }));
    if (profileErrors[field]) setProfileErrors((e) => ({ ...e, [field]: '' }));
  }

  function setPwField(field: keyof typeof pwForm, value: string) {
    setPwForm((p) => ({ ...p, [field]: value }));
    if (pwErrors[field]) setPwErrors((e) => ({ ...e, [field]: '' }));
  }

  function validateProfile() {
    const next: Record<string, string> = {};
    if (!profileForm.name.trim()) next.name = 'El nombre es obligatorio.';
    if (profileForm.phone && !PHONE_RE.test(profileForm.phone)) {
      next.phone = 'Formato de teléfono inválido.';
    }
    setProfileErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSaveProfile() {
    if (profileSaving || !validateProfile()) return;
    setProfileSaving(true);
    try {
      const body: UpdateProfileRequest = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
        alias: profileForm.alias.trim() || undefined,
      };
      await updateProfile(body);
      showToast('Perfil actualizado.', 'success');
      closeModal();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setProfileSaving(false);
    }
  }

  function validatePassword() {
    const next: Record<string, string> = {};
    if (!pwForm.currentPassword) next.currentPassword = 'La contraseña actual es obligatoria.';
    if (pwForm.newPassword.length < 6) next.newPassword = 'Mínimo 6 caracteres.';
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden.';
    }
    setPwErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleChangePassword() {
    if (pwSaving || !validatePassword()) return;
    setPwSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Contraseña actualizada.', 'success');
      closeModal();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setPwSaving(false);
    }
  }
  function InfoRow({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }) {
    return (
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={colors.primaryDark} />
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    );
  }
  return (
    <Screen scroll>
      {/* Cabecera de perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user && (
          <View style={styles.badge}>
            <RoleBadge role={user.role} />
          </View>
        )}
      </View>

      {/* Tarjeta de información */}
      <Card style={styles.infoCard}>
        <InfoRow icon="call-outline" label="Teléfono" value={user?.phone || 'No registrado'} />
        <View style={styles.divider} />
        <InfoRow icon="at-outline" label="Alias" value={user?.alias || 'No registrado'} />
        <View style={styles.divider} />
        <InfoRow icon="id-card-outline" label="ID de usuario" value={`#${user?.id ?? '—'}`} />
      </Card>

      {/* Acciones de perfil */}
      <View style={styles.actions}>
        <Button title="Editar perfil" variant="secondary" onPress={openEditProfile} />
        <Button
          title="Cambiar contraseña"
          variant="ghost"
          onPress={openChangePassword}
          style={{ marginTop: spacing.md }}
        />
      </View>

      {/* Configuración visual */}
      <Card style={styles.appearanceCard}>
        <View style={styles.appearanceHeader}>
          <Ionicons
            name="color-palette-outline"
            size={22}
            color={colors.primaryDark}
          />

          <View style={styles.appearanceTitleBlock}>
            <Text style={styles.appearanceTitle}>Apariencia</Text>
            <Text style={styles.appearanceSubtitle}>
              Tema actual: {themeName === 'ocean' ? 'Ocean' : 'Nature'} ·{' '}
              {themeMode === 'light' ? 'Claro' : 'Oscuro'}
            </Text>
          </View>
        </View>

        <Button
          title={themeMode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          variant="secondary"
          onPress={() => {
            void toggleThemeMode();
          }}
        />

        <Button
          title={themeName === 'ocean' ? 'Cambiar a tema Nature' : 'Cambiar a tema Ocean'}
          variant="ghost"
          onPress={() => {
            void toggleThemeName();
          }}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Contactos de emergencia */}
      <Card style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <Ionicons name="people-outline" size={22} color={colors.danger} />
          <View style={styles.emergencyTitleBlock}>
            <Text style={styles.emergencyTitle}>Contactos de emergencia</Text>
            <Text style={styles.emergencySubtitle}>
              Se les enviará un SMS con tu ubicación al activar SOS
            </Text>
          </View>
        </View>

        {([0, 1, 2] as const).map((i) => {
          const contact = contacts[i];
          return (
            <View key={i} style={styles.contactSlot}>
              <View style={styles.contactSlotLeft}>
                <Text style={styles.contactSlotLabel}>Contacto {i + 1}</Text>
                {contact ? (
                  <>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </>
                ) : (
                  <Text style={styles.contactEmpty}>No configurado</Text>
                )}
              </View>
              <View style={styles.contactSlotActions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => openContactModal(i)}
                  style={styles.contactIconBtn}
                >
                  <Ionicons
                    name={contact ? 'pencil-outline' : 'add-circle-outline'}
                    size={22}
                    color={colors.primary}
                  />
                </Pressable>
                {contact && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => void handleDeleteContact(i)}
                    style={styles.contactIconBtn}
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </Card>

      <Button
        title="Cerrar sesión"
        variant="danger"
        onPress={() => setLogoutConfirm(true)}
        style={{ marginTop: spacing.xl }}
      />

      {/* Modal: Editar perfil */}
      <Modal
        visible={activeModal === 'editProfile'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrapper}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar perfil</Text>
                <Pressable onPress={closeModal} hitSlop={8} disabled={profileSaving}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Input
                  label="Nombre completo"
                  value={profileForm.name}
                  onChangeText={(v) => setProfileField('name', v)}
                  error={profileErrors.name}
                  editable={!profileSaving}
                />
                <Input
                  label="Teléfono (opcional)"
                  keyboardType="phone-pad"
                  value={profileForm.phone}
                  onChangeText={(v) => setProfileField('phone', v)}
                  error={profileErrors.phone}
                  editable={!profileSaving}
                />
                <Input
                  label="Alias (opcional)"
                  autoCapitalize="none"
                  value={profileForm.alias}
                  onChangeText={(v) => setProfileField('alias', v)}
                  error={profileErrors.alias}
                  editable={!profileSaving}
                />
              </ScrollView>
              <View style={styles.modalActions}>
                <View style={styles.modalAction}>
                  <Button title="Cancelar" variant="ghost" onPress={closeModal} disabled={profileSaving} />
                </View>
                <View style={styles.modalAction}>
                  <Button title="Guardar" onPress={handleSaveProfile} loading={profileSaving} />
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Modal: Cambiar contraseña */}
      <Modal
        visible={activeModal === 'changePassword'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrapper}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cambiar contraseña</Text>
                <Pressable onPress={closeModal} hitSlop={8} disabled={pwSaving}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
              <Input
                label="Contraseña actual"
                secureTextEntry
                value={pwForm.currentPassword}
                onChangeText={(v) => setPwField('currentPassword', v)}
                error={pwErrors.currentPassword}
                editable={!pwSaving}
              />
              <Input
                label="Nueva contraseña"
                secureTextEntry
                value={pwForm.newPassword}
                onChangeText={(v) => setPwField('newPassword', v)}
                error={pwErrors.newPassword}
                editable={!pwSaving}
              />
              <Input
                label="Confirmar nueva contraseña"
                secureTextEntry
                value={pwForm.confirmPassword}
                onChangeText={(v) => setPwField('confirmPassword', v)}
                error={pwErrors.confirmPassword}
                editable={!pwSaving}
              />
              <View style={styles.modalActions}>
                <View style={styles.modalAction}>
                  <Button title="Cancelar" variant="ghost" onPress={closeModal} disabled={pwSaving} />
                </View>
                <View style={styles.modalAction}>
                  <Button title="Cambiar" onPress={handleChangePassword} loading={pwSaving} />
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Modal: Editar contacto de emergencia */}
      <Modal
        visible={activeModal === 'editContact'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrapper}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Contacto {contactModal.index + 1}
                </Text>
                <Pressable onPress={closeModal} hitSlop={8} disabled={contactModal.saving}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
              <Input
                label="Nombre"
                value={contactModal.name}
                onChangeText={(v) => setContactField('name', v)}
                error={contactModal.errors.name}
                editable={!contactModal.saving}
                placeholder="Ej. Mamá, Juan García…"
              />
              <Input
                label="Teléfono"
                keyboardType="phone-pad"
                value={contactModal.phone}
                onChangeText={(v) => setContactField('phone', v)}
                error={contactModal.errors.phone}
                editable={!contactModal.saving}
                placeholder="+51 987 654 321"
              />
              <View style={styles.modalActions}>
                <View style={styles.modalAction}>
                  <Button title="Cancelar" variant="ghost" onPress={closeModal} disabled={contactModal.saving} />
                </View>
                <View style={styles.modalAction}>
                  <Button title="Guardar" onPress={() => void handleSaveContact()} loading={contactModal.saving} />
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Confirmar logout */}
      <ConfirmModal
        visible={logoutConfirm}
        title="Cerrar sesión"
        message="¿Seguro que deseas salir de tu cuenta?"
        confirmLabel="Cerrar sesión"
        destructive
        onConfirm={() => {
          setLogoutConfirm(false);
          void logout();
        }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors){
  return StyleSheet.create({
    header: { alignItems: 'center', marginVertical: spacing.xl },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: radius.full,
      backgroundColor: colors.navy,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.textInverse, fontSize: 36, fontWeight: '700' },
    name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.md },
    email: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
    badge: { marginTop: spacing.md },
    infoCard: { gap: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    rowLabel: { fontSize: 14, color: colors.textMuted, flex: 1 },
    rowValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.border },
    actions: { marginTop: spacing.xl },
    appearanceCard: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },

    appearanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },

    appearanceTitleBlock: {
      flex: 1,
    },

    appearanceTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },

    appearanceSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalWrapper: { width: '100%', maxWidth: 420 },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
    modalAction: { flex: 1 },
    emergencyCard: { marginTop: spacing.xl, gap: 0 },
    emergencyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    emergencyTitleBlock: { flex: 1 },
    emergencyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    emergencySubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    contactSlot: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    contactSlotLeft: { flex: 1 },
    contactSlotLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 2 },
    contactName: { fontSize: 14, fontWeight: '700', color: colors.text },
    contactPhone: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
    contactEmpty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
    contactSlotActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    contactIconBtn: { padding: 4 },
});}
