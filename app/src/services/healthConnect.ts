// Android Health Connect integration. Lazy-required (like services/location.ts and
// export.ts) so the absent native module, iOS, Expo Go without the plugin, this sandbox -
// degrades to a no-op instead of crashing. Nothing here fabricates data: readToday returns
// null unless Health Connect actually hands back records.

import { Platform } from 'react-native';
import type { HealthDaily } from '@nabdh/shared';
import type { IconName } from '../components/Icon';

let HC: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  HC = require('react-native-health-connect');
} catch {
  HC = null;
}

export type HCStatus = 'ios' | 'unsupported' | 'not_installed' | 'ready' | 'connected';

export const HC_DATA_TYPES: { key: string; label: string; icon: IconName }[] = [
  { key: 'Steps', label: 'Steps & activity', icon: 'footprints' },
  { key: 'HeartRate', label: 'Heart rate', icon: 'heart' },
  { key: 'SleepSession', label: 'Sleep', icon: 'moon' },
  { key: 'Distance', label: 'Distance', icon: 'activity' },
  { key: 'ActiveCaloriesBurned', label: 'Active calories', icon: 'flame' },
];

const PERMS = [
  ...HC_DATA_TYPES.map((d) => ({ accessType: 'read', recordType: d.key })),
  // RestingHeartRate is its own record type (no separate UI row, "Heart rate" covers it).
  { accessType: 'read', recordType: 'RestingHeartRate' },
];

/** True only on Android with the native module actually present. */
export function isAvailable(): boolean {
  return !!HC && Platform.OS === 'android';
}

/** Platform- and install-aware status (never throws). */
export async function getStatus(): Promise<HCStatus> {
  if (Platform.OS === 'ios') return 'ios';
  if (!HC) return 'unsupported';
  try {
    await HC.initialize();
    const sdk = await HC.getSdkStatus();
    return sdk === HC.SdkAvailabilityStatus?.SDK_AVAILABLE ? 'ready' : 'not_installed';
  } catch {
    return 'not_installed';
  }
}

export async function requestPermissions(): Promise<'granted' | 'denied' | 'unavailable'> {
  if (!isAvailable()) return 'unavailable';
  try {
    await HC.initialize();
    const granted = await HC.requestPermission(PERMS);
    return Array.isArray(granted) && granted.length > 0 ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

function todayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return { operator: 'between', startTime: start.toISOString(), endTime: now.toISOString() } as const;
}

async function sumRecords(type: string, pick: (r: any) => number): Promise<number> {
  try {
    const res = await HC.readRecords(type, { timeRangeFilter: todayRange() });
    const recs = res?.records ?? res ?? [];
    return recs.reduce((a: number, r: any) => a + (pick(r) || 0), 0);
  } catch {
    return 0;
  }
}

/** Read today's totals into the app's device-agnostic summary, or null if nothing came back. */
export async function readToday(): Promise<HealthDaily | null> {
  if (!isAvailable()) return null;
  try {
    await HC.initialize();
    const date = new Date().toISOString().slice(0, 10);
    const steps = await sumRecords('Steps', (r) => r.count);
    const distanceM = await sumRecords('Distance', (r) => r.distance?.inMeters ?? 0);
    const activeKcal = await sumRecords('ActiveCaloriesBurned', (r) => r.energy?.inKilocalories ?? 0);
    const sleepMin = await sumRecords('SleepSession', (r) => {
      const s = new Date(r.startTime).getTime();
      const e = new Date(r.endTime).getTime();
      return e > s ? (e - s) / 60000 : 0;
    });

    // Use Health Connect's dedicated RestingHeartRate record, not a min-of-day proxy,
    // which would mislabel a sleeping/artefact low as the resting rate.
    let restingHeartRate: number | undefined;
    try {
      const rhr = await HC.readRecords('RestingHeartRate', { timeRangeFilter: todayRange() });
      const vals = (rhr?.records ?? [])
        .map((r: any) => r.beatsPerMinute)
        .filter((n: number) => n >= 30 && n <= 120);
      if (vals.length) restingHeartRate = Math.round(vals[vals.length - 1]); // latest reading
    } catch {
      /* resting heart rate optional */
    }

    const summary: HealthDaily = {
      date,
      source: 'merged',
      steps: steps || undefined,
      distanceKm: distanceM ? +(distanceM / 1000).toFixed(2) : undefined,
      activeEnergyKcal: activeKcal ? Math.round(activeKcal) : undefined,
      sleepMinutes: sleepMin ? Math.round(sleepMin) : undefined,
      restingHeartRate,
    };
    const hasAny =
      summary.steps || summary.distanceKm || summary.activeEnergyKcal || summary.sleepMinutes || summary.restingHeartRate;
    return hasAny ? summary : null;
  } catch {
    return null;
  }
}
