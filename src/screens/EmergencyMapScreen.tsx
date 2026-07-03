import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import comisariasData from '../data/comisarias.json';

type Props = NativeStackScreenProps<HomeStackParamList, 'EmergencyMap'>;

interface Comisaria {
  id: number;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}

interface ComisariaWithDistance extends Comisaria {
  distanceKm: number;
}

const COMISARIAS: Comisaria[] = comisariasData as Comisaria[];

// Lima centro como fallback si GPS falla
const LIMA_DEFAULT = { latitude: -12.0464, longitude: -77.0428 };
const NEARBY_RADIUS_KM = 5;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function callPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
}

export function EmergencyMapScreen({ route }: Props) {
  const paramLat = route.params?.latitude;
  const paramLng = route.params?.longitude;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    paramLat && paramLng ? { latitude: paramLat, longitude: paramLng } : null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(!paramLat);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (paramLat && paramLng) return;
    (async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permiso de ubicación denegado. Mostrando Lima centro.');
          setUserLocation(LIMA_DEFAULT);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        setLocationError('No se pudo obtener tu ubicación. Mostrando Lima centro.');
        setUserLocation(LIMA_DEFAULT);
      } finally {
        setLocating(false);
      }
    })();
  }, [paramLat, paramLng]);

  const sorted = useMemo<ComisariaWithDistance[]>(() => {
    if (!userLocation) return [];
    return COMISARIAS.map((c) => ({
      ...c,
      distanceKm: haversine(userLocation.latitude, userLocation.longitude, c.lat, c.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  const nearby = useMemo(
    () => sorted.filter((c) => c.distanceKm <= NEARBY_RADIUS_KM),
    [sorted],
  );

  // Si no hay ninguna dentro de 5km, mostrar las 5 más cercanas
  const displayed = nearby.length > 0 ? nearby : sorted.slice(0, 5);
  const nearest = displayed[0] ?? null;
  const selected = displayed.find((c) => c.id === selectedId) ?? nearest;

  const mapRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }
    : {
        ...LIMA_DEFAULT,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };

  if (locating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Obteniendo tu ubicación…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView style={styles.map} region={mapRegion} showsUserLocation={false}>
        {/* Marcador usuario */}
        {userLocation && (
          <>
            <Marker
              coordinate={userLocation}
              title="Tu ubicación"
              pinColor={colors.primary}
            />
            <Circle
              center={userLocation}
              radius={NEARBY_RADIUS_KM * 1000}
              strokeColor="rgba(59,130,246,0.4)"
              fillColor="rgba(59,130,246,0.07)"
              strokeWidth={1.5}
            />
          </>
        )}

        {/* Marcadores comisarías */}
        {displayed.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.lat, longitude: c.lng }}
            title={c.name}
            description={c.address}
            pinColor={c.id === selected?.id ? colors.danger : '#E63946'}
            onPress={() => setSelectedId(c.id)}
          />
        ))}
      </MapView>

      {/* Banner de error de ubicación */}
      {locationError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
          <Text style={styles.errorBannerText}>{locationError}</Text>
        </View>
      )}

      {/* Panel inferior */}
      <View style={styles.panel}>
        {/* Comisaría seleccionada / más cercana */}
        {selected && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <Ionicons name="shield-outline" size={20} color={colors.danger} />
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName} numberOfLines={2}>{selected.name}</Text>
                <Text style={styles.selectedAddress} numberOfLines={1}>{selected.address}</Text>
              </View>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{selected.distanceKm.toFixed(1)} km</Text>
              </View>
            </View>
            <Pressable style={styles.callBtn} onPress={() => callPhone(selected.phone)}>
              <Ionicons name="call" size={16} color={colors.textInverse} />
              <Text style={styles.callBtnText}>Llamar: {selected.phone}</Text>
            </Pressable>
          </View>
        )}

        {/* Lista de cercanas */}
        <Text style={styles.listTitle}>
          {nearby.length > 0
            ? `${nearby.length} comisarías en ${NEARBY_RADIUS_KM} km`
            : '5 más cercanas'}
        </Text>
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {displayed.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.listItem, c.id === selected?.id && styles.listItemSelected]}
              onPress={() => setSelectedId(c.id)}
            >
              <Ionicons
                name="location"
                size={16}
                color={c.id === selected?.id ? colors.danger : colors.textMuted}
              />
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.listItemDist}>{c.distanceKm.toFixed(1)} km</Text>
              </View>
              <Pressable onPress={() => callPhone(c.phone)} hitSlop={8}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const PANEL_HEIGHT = 310;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: 15, color: colors.textMuted },

  map: { flex: 1 },

  errorBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#FEF9C3',
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    elevation: 4,
  },
  errorBannerText: { fontSize: 12, color: '#92400E', flex: 1 },

  panel: {
    height: PANEL_HEIGHT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.md,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },

  selectedCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 14, fontWeight: '700', color: colors.text },
  selectedAddress: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  distanceBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  distanceText: { fontSize: 11, fontWeight: '700', color: colors.textInverse },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  callBtnText: { fontSize: 14, fontWeight: '700', color: colors.textInverse },

  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  list: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  listItemSelected: { backgroundColor: '#FEF2F2', borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  listItemDist: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
