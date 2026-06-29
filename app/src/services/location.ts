// Thin wrapper over expo-location. Lazy-required (like services/export.ts and
// notifications.ts) so a missing native module, web, Expo Go without the plugin, this
// sandbox, degrades to a no-op instead of crashing.

import type { GeoPoint } from './geo';

let Location: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Location = require('expo-location');
} catch {
  Location = null;
}

export type PermissionResult = 'granted' | 'denied' | 'unavailable';
export type Subscription = { remove: () => void };

/** True if expo-location is actually present on this build. */
export function locationAvailable(): boolean {
  return !!Location;
}

export async function ensurePermission(): Promise<PermissionResult> {
  if (!Location) return 'unavailable';
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Start streaming positions. Returns a subscription (call .remove()) or null if
 * unavailable / failed. Never throws. */
export async function watchPosition(onPoint: (p: GeoPoint) => void): Promise<Subscription | null> {
  if (!Location) return null;
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy?.BestForNavigation ?? 6,
        distanceInterval: 4, // metres between updates
        timeInterval: 1500, // ms
      },
      (loc: any) => {
        // Drop low-accuracy fixes, they're mostly drift and would inflate distance.
        const acc = loc.coords.accuracy;
        if (acc != null && acc > 25) return;
        onPoint({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          alt: loc.coords.altitude ?? undefined,
          t: loc.timestamp ?? Date.now(),
          acc: acc ?? undefined,
        });
      },
    );
    return sub as Subscription;
  } catch {
    return null;
  }
}
