import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Input, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorMessages';
import { colors, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  function clearError(field: keyof typeof errors) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'El correo es obligatorio.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Correo con formato inválido.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    else if (password.length < 6) next.password = 'Mínimo 6 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles.title}>SecureTrace</Text>
          <Text style={styles.subtitle}>Seguridad ciudadana en tus manos</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo electrónico"
            placeholder="tu@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email'); }}
            error={errors.email}
            editable={!submitting}
          />
          <Input
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password'); }}
            error={errors.password}
            editable={!submitting}
          />
          <Button
            title="Iniciar sesión"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />

          <Pressable
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            disabled={submitting}
          >
            <Text style={styles.registerText}>
              ¿No tienes cuenta? <Text style={styles.registerBold}>Regístrate</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xxl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.navy },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  form: { marginTop: spacing.lg },
  registerLink: { marginTop: spacing.xl, alignItems: 'center' },
  registerText: { color: colors.textMuted, fontSize: 14 },
  registerBold: { color: colors.primary, fontWeight: '700' },
});
