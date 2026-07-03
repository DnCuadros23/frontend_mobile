import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Input, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorMessages';
import { colors, radius, spacing } from '../../theme';
import type { Role } from '../../types';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'VICTIM', label: 'Ciudadano' },
  { value: 'SPECIALIST', label: 'Especialista' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    alias: '',
  });
  const [role, setRole] = useState<Role>('VICTIM');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio.';
    if (!form.email.trim()) next.email = 'El correo es obligatorio.';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Correo con formato inválido.';
    if (form.password.length < 6) next.password = 'Mínimo 6 caracteres.';
    if (!form.confirmPassword) next.confirmPassword = 'Confirma tu contraseña.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        alias: form.alias.trim() || undefined,
        role,
      });
      showToast('¡Cuenta creada con éxito!', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a SecureTrace</Text>

        <View style={styles.form}>
          <Input
            label="Nombre completo"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            error={errors.name}
            editable={!submitting}
          />
          <Input
            label="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => set('email', v)}
            error={errors.email}
            editable={!submitting}
          />
          <Input
            label="Contraseña"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => set('password', v)}
            error={errors.password}
            editable={!submitting}
          />
          <Input
            label="Confirmar contraseña"
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={(v) => set('confirmPassword', v)}
            error={errors.confirmPassword}
            editable={!submitting}
          />
          <Input
            label="Teléfono (opcional)"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => set('phone', v)}
            editable={!submitting}
          />
          <Input
            label="Alias (opcional)"
            autoCapitalize="none"
            value={form.alias}
            onChangeText={(v) => set('alias', v)}
            editable={!submitting}
          />

          <Text style={styles.roleLabel}>Tipo de cuenta</Text>
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setRole(opt.value)}
                style={[styles.roleChip, role === opt.value && styles.roleChipActive]}
                disabled={submitting}
              >
                <Text style={[styles.roleText, role === opt.value && styles.roleTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title="Registrarme"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={{ marginTop: spacing.lg }}
          />
          <Pressable style={styles.loginLink} onPress={() => navigation.goBack()} disabled={submitting}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: colors.navy, marginTop: spacing.lg },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  form: { marginTop: spacing.xl },
  roleLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleChip: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  roleChipActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1A` },
  roleText: { color: colors.textMuted, fontWeight: '600' },
  roleTextActive: { color: colors.primary },
  loginLink: { marginTop: spacing.xl, alignItems: 'center' },
  loginText: { color: colors.textMuted, fontSize: 14 },
  loginBold: { color: colors.primary, fontWeight: '700' },
});
