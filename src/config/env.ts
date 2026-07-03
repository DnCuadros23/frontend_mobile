/**
 * Configuración central de entorno.
 * Las variables EXPO_PUBLIC_* se inyectan en tiempo de build por Expo.
 */
export const env = {
  /** URL base del backend SecureTrace. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  /** API key opcional para servicios de mapas externos. */
  mapsApiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY ?? '',
} as const;
