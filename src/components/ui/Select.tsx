import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  value,
  options,
  error,
  placeholder = 'Selecciona una opción',
  disabled = false,
  onChange,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();

  const selectedOption = options.find((option) => option.value === value);

  function handleSelect(nextValue: T) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedOption ? colors.text : colors.textMuted,
            },
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {!!error && (
        <Text style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[
            styles.overlay,
            { backgroundColor: colors.overlay },
          ]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              styles.modal,
              { backgroundColor: colors.surface },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {label || 'Seleccionar'}
            </Text>

            {options.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={[
                    styles.option,
                    active && { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: active ? colors.primary : colors.text,
                        fontWeight: active ? '700' : '400',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>

                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
  trigger: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  option: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 15,
  },
});