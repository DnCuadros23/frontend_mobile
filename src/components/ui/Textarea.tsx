import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { radius, spacing } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function Textarea({ label, error, style, ...props }: TextareaProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}

      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        style={[
          styles.textarea,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />

      {!!error && (
        <Text style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});