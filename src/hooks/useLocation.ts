/**
 * Foreground location sensor hook (expo-location).
 * Shared by the SOS flow and the incident report flow.
 *
 *   const { getCurrentLocation, loading, error } = useLocation();
 *   const coords = await getCurrentLocation(); // null if denied/unavailable
 */
import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  /** Requests permission if needed and resolves the current position. Resolves null on failure. */
  getCurrentLocation: () => Promise<Coordinates | null>;
}

export function useLocation(): UseLocationResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Reuse an already-granted permission; only prompt when needed.
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        ({ status } = await Location.requestForegroundPermissionsAsync());
      }
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado.');
        return null;
      }

      // 2. Make sure the device location service is actually turned on.
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError('Activa la ubicación del dispositivo para continuar.');
        return null;
      }

      // 3. Read the current position.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoordinates(next);
      return next;
    } catch {
      setError('No se pudo obtener la ubicación. Inténtalo de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coordinates, loading, error, getCurrentLocation };
}
