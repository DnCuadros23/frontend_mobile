import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { Button } from './ui';

interface State {
  hasError: boolean;
}

/** Captura errores de renderizado para que la app no quede en pantalla blanca. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturó un error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Ionicons name="warning-outline" size={48} color={colors.danger} />
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.text}>Ocurrió un error inesperado en la aplicación.</Text>
        <View style={styles.btn}>
          <Button title="Reintentar" onPress={() => this.setState({ hasError: false })} fullWidth={false} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  text: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  btn: { marginTop: spacing.lg },
});
