// app.config.js — dynamic config que extiende app.json con valores de entorno.
// Expo carga este archivo automáticamente y lo fusiona con app.json.
// La Google Maps API key se inyecta aquí para que react-native-maps funcione en Android.

/** @param {{ config: import('@expo/config-types').ExpoConfig }} param */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY ?? '',
      },
    },
  },
});
