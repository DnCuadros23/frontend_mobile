import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, priorityColor, radius, statusColor } from '../../theme';
import type { CaseStatus, Priority, Role } from '../../types';

const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: 'Abierto',
  UNDER_INVESTIGATION: 'En investigación',
  CLOSED: 'Cerrado',
  ARCHIVED: 'Archivado',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const ROLE_LABEL: Record<Role, string> = {
  VICTIM: 'Víctima',
  SPECIALIST: 'Especialista',
  ADMIN: 'Admin',
};

function BaseBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <BaseBadge label={STATUS_LABEL[status]} color={statusColor[status] ?? colors.textMuted} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <BaseBadge label={PRIORITY_LABEL[priority]} color={priorityColor[priority] ?? colors.textMuted} />;
}

export function RoleBadge({ role }: { role: Role }) {
  return <BaseBadge label={ROLE_LABEL[role]} color={colors.primaryDark} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '600' },
});

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const VARIANT_COLOR: Record<BadgeVariant, string> = {
  info: colors.info,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.textMuted,
};

export function Badge({
  label,
  variant = 'neutral',
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  return (
    <BaseBadge
      label={label}
      color={VARIANT_COLOR[variant]}
    />
  );
}
