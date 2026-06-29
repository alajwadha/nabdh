import { useSyncExternalStore } from 'react';
import { prayerVersion, subscribePrayer } from './prayer';

/** Subscribe a component to prayer-time updates so it re-renders when the times refresh
 * (e.g. when location-based times replace the demo defaults). Returns the current version. */
export function usePrayerTimes(): number {
  return useSyncExternalStore(subscribePrayer, prayerVersion, prayerVersion);
}
