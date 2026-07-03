/**
 * Sistema de diseño SecureTrace.
 * Ocean Light es el tema predeterminado.
 */

export type ThemeName = 'ocean' | 'nature';
export type ThemeMode = 'light' | 'dark';

export const palettes = {
  ocean: {
    navy: '#123C69',
    primaryDark: '#2A5F97',
    primary: '#3B82F6',
    background: '#EEF2F6',
    danger: '#E63946',
    accent: '#2EC4B6',
  },
  nature: {
    navy: '#40A597',
    primaryDark: '#11727E',
    primary: '#30B7AB',
    background: '#F5F7F7',
    danger: '#FF5A5F',
    accent: '#A3E6DD',
  },
} as const;

export const themes = {
  ocean: {
    light: {
      primary: palettes.ocean.primary,
      primaryDark: palettes.ocean.primaryDark,
      navy: palettes.ocean.navy,
      accent: palettes.ocean.accent,

      danger: palettes.ocean.danger,
      warning: '#F59E0B',
      success: '#22C55E',
      info: palettes.ocean.primary,

      background: palettes.ocean.background,
      surface: '#FFFFFF',
      surfaceMuted: '#F8FAFC',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',

      text: '#0F172A',
      textMuted: '#64748B',
      textSoft: '#94A3B8',
      textInverse: '#FFFFFF',

      overlay: 'rgba(15, 23, 42, 0.5)',

      primarySoft: 'rgba(59, 130, 246, 0.12)',
      primarySofter: 'rgba(59, 130, 246, 0.08)',
      dangerSoft: '#FEF2F2',
      dangerSofter: 'rgba(230, 57, 70, 0.12)',
      warningSoft: '#FEF9C3',
      warningText: '#92400E',
      successSoft: '#DCFCE7',

      whiteOverlayStrong: 'rgba(255,255,255,0.75)',
      whiteOverlay: 'rgba(255,255,255,0.65)',
      whiteOverlaySoft: 'rgba(255,255,255,0.4)',

      mapPrimaryStroke: 'rgba(59,130,246,0.4)',
      mapPrimaryFill: 'rgba(59,130,246,0.07)',
    },

    dark: {
      primary: palettes.ocean.primary,
      primaryDark: palettes.ocean.primaryDark,
      navy: '#061525',
      accent: palettes.ocean.accent,

      danger: palettes.ocean.danger,
      warning: '#F59E0B',
      success: '#22C55E',
      info: palettes.ocean.primary,

      background: '#07111F',
      surface: '#0F1D2E',
      surfaceMuted: '#13243A',
      border: '#1F334C',
      borderStrong: '#2A4563',

      text: '#F8FAFC',
      textMuted: '#CBD5E1',
      textSoft: '#94A3B8',
      textInverse: '#FFFFFF',

      overlay: 'rgba(0, 0, 0, 0.65)',

      primarySoft: 'rgba(59, 130, 246, 0.18)',
      primarySofter: 'rgba(59, 130, 246, 0.1)',
      dangerSoft: 'rgba(230, 57, 70, 0.16)',
      dangerSofter: 'rgba(230, 57, 70, 0.1)',
      warningSoft: 'rgba(245, 158, 11, 0.16)',
      warningText: '#FBBF24',
      successSoft: 'rgba(34, 197, 94, 0.16)',

      whiteOverlayStrong: 'rgba(255,255,255,0.75)',
      whiteOverlay: 'rgba(255,255,255,0.65)',
      whiteOverlaySoft: 'rgba(255,255,255,0.4)',

      mapPrimaryStroke: 'rgba(59,130,246,0.45)',
      mapPrimaryFill: 'rgba(59,130,246,0.12)',
    },
  },

  nature: {
    light: {
      primary: palettes.nature.primary,
      primaryDark: palettes.nature.primaryDark,
      navy: palettes.nature.navy,
      accent: palettes.nature.accent,

      danger: palettes.nature.danger,
      warning: '#F59E0B',
      success: '#22C55E',
      info: palettes.nature.primary,

      background: palettes.nature.background,
      surface: '#FFFFFF',
      surfaceMuted: '#F8FAFC',
      border: '#DDE7E7',
      borderStrong: '#BFD4D4',

      text: '#102A2E',
      textMuted: '#60777A',
      textSoft: '#8AA0A3',
      textInverse: '#FFFFFF',

      overlay: 'rgba(15, 23, 42, 0.5)',

      primarySoft: 'rgba(48, 183, 171, 0.14)',
      primarySofter: 'rgba(48, 183, 171, 0.08)',
      dangerSoft: 'rgba(255, 90, 95, 0.12)',
      dangerSofter: 'rgba(255, 90, 95, 0.08)',
      warningSoft: '#FEF9C3',
      warningText: '#92400E',
      successSoft: '#DCFCE7',

      whiteOverlayStrong: 'rgba(255,255,255,0.75)',
      whiteOverlay: 'rgba(255,255,255,0.65)',
      whiteOverlaySoft: 'rgba(255,255,255,0.4)',

      mapPrimaryStroke: 'rgba(48,183,171,0.4)',
      mapPrimaryFill: 'rgba(48,183,171,0.08)',
    },

    dark: {
      primary: palettes.nature.primary,
      primaryDark: palettes.nature.primaryDark,
      navy: '#062E34',
      accent: palettes.nature.accent,

      danger: palettes.nature.danger,
      warning: '#F59E0B',
      success: '#22C55E',
      info: palettes.nature.primary,

      background: '#061A1D',
      surface: '#0D282C',
      surfaceMuted: '#12363B',
      border: '#1B4A51',
      borderStrong: '#28656E',

      text: '#F5F7F7',
      textMuted: '#C4D4D6',
      textSoft: '#8FA8AB',
      textInverse: '#FFFFFF',

      overlay: 'rgba(0, 0, 0, 0.65)',

      primarySoft: 'rgba(48, 183, 171, 0.18)',
      primarySofter: 'rgba(48, 183, 171, 0.1)',
      dangerSoft: 'rgba(255, 90, 95, 0.16)',
      dangerSofter: 'rgba(255, 90, 95, 0.1)',
      warningSoft: 'rgba(245, 158, 11, 0.16)',
      warningText: '#FBBF24',
      successSoft: 'rgba(34, 197, 94, 0.16)',

      whiteOverlayStrong: 'rgba(255,255,255,0.75)',
      whiteOverlay: 'rgba(255,255,255,0.65)',
      whiteOverlaySoft: 'rgba(255,255,255,0.4)',

      mapPrimaryStroke: 'rgba(48,183,171,0.45)',
      mapPrimaryFill: 'rgba(48,183,171,0.12)',
    },
  },
} as const;

type WidenThemeColors<T> = {
  readonly [K in keyof T]: string;
};

export type ThemeColors = WidenThemeColors<typeof themes.ocean.light>;

/**
 * Compatibilidad con archivos que todavía importan `colors` directo.
 * Ocean Light queda como default.
 */
export const colors: ThemeColors = themes.ocean.light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const statusColor: Record<string, string> = {
  OPEN: colors.primary,
  UNDER_INVESTIGATION: colors.warning,
  CLOSED: colors.success,
  ARCHIVED: colors.textMuted,
};

export const priorityColor: Record<string, string> = {
  LOW: colors.textMuted,
  MEDIUM: colors.primary,
  HIGH: colors.warning,
  CRITICAL: colors.danger,
};

export const theme = { colors, spacing, radius, typography };
export default theme;