import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { radius, spacing } from '../../theme';

interface CaseMapProps {
  latitude: number;
  longitude: number;
  /** Optional marker callout text. */
  title?: string;
  description?: string;
  /** Map height in px (defaults to a compact preview). */
  height?: number;
}

// Tight zoom level suitable for a single-point preview.
const REGION_DELTA = 0.01;

/** Read-only map centered on a coordinate with a single marker. */
export function CaseMap({ latitude, longitude, title, description, height = 180 }: CaseMapProps) {
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: REGION_DELTA,
          longitudeDelta: REGION_DELTA,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          description={description}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
});
