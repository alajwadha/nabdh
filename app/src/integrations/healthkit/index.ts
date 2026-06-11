import { Platform } from 'react-native';
import type { HealthDaily } from '@nabdh/shared';
import { todayKey } from '../../services/health';

// HealthKit wrapper around @kingstinct/react-native-healthkit (Nitro, v14+).
// HealthKit is iOS-only and unavailable in the Simulator: all of this must be
// tested on a physical iPhone (paired Apple Watch for HR/HRV/SpO2/sleep).
//
// NOTE: the exact query signatures of @kingstinct v14 may differ slightly from
// the calls below. The module is written defensively (try/catch, optional
// chaining) so it never crashes the app; finalize the field names against the
// installed version during on-device testing.

export const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

// Lazy require so non-iOS / Expo Go does not fail at import time.
function hk(): any | null {
  if (Platform.OS !== 'ios') return null;
  try {
    return require('@kingstinct/react-native-healthkit');
  } catch {
    return null;
  }
}

export async function isAvailable(): Promise<boolean> {
  const mod = hk();
  if (!mod) return false;
  try {
    return await mod.isHealthDataAvailable();
  } catch {
    return false;
  }
}

export async function requestHealthKitPermissions(): Promise<boolean> {
  const mod = hk();
  if (!mod) return false;
  try {
    await mod.requestAuthorization([], READ_TYPES as unknown as string[]);
    return true;
  } catch {
    return false;
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function round(n: number | undefined): number | undefined {
  return n == null ? undefined : Math.round(n);
}

async function sumQuantity(id: string, from: Date, to: Date): Promise<number | undefined> {
  const mod = hk();
  if (!mod) return undefined;
  try {
    const samples = await mod.queryQuantitySamples(id, { from, to });
    if (!samples?.length) return undefined;
    return samples.reduce((sum: number, s: any) => sum + (s.quantity ?? s.value ?? 0), 0);
  } catch {
    return undefined;
  }
}

async function latestQuantity(id: string, from: Date, to: Date): Promise<number | undefined> {
  const mod = hk();
  if (!mod) return undefined;
  try {
    const samples = await mod.queryQuantitySamples(id, { from, to, limit: 1, ascending: false });
    const s: any = samples?.[0];
    return s ? (s.quantity ?? s.value) : undefined;
  } catch {
    return undefined;
  }
}

async function sleepMinutes(from: Date, to: Date): Promise<number | undefined> {
  const mod = hk();
  if (!mod) return undefined;
  try {
    const samples = await mod.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      from,
      to,
    });
    if (!samples?.length) return undefined;
    // Sum intervals marked as asleep (HKCategoryValueSleepAnalysis asleep* = 1,3,4,5).
    const ASLEEP = new Set([1, 3, 4, 5]);
    return samples.reduce((mins: number, s: any) => {
      const duration =
        (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
      return mins + (ASLEEP.has(s.value) ? duration : 0);
    }, 0);
  } catch {
    return undefined;
  }
}

/** Reads today's metrics and builds a minimized, device-agnostic summary. */
export async function readTodaySummary(): Promise<HealthDaily> {
  const from = startOfToday();
  const to = new Date();

  const [steps, distanceMeters, restHr, hrv, spo2, active, basal, sleep] = await Promise.all([
    sumQuantity('HKQuantityTypeIdentifierStepCount', from, to),
    sumQuantity('HKQuantityTypeIdentifierDistanceWalkingRunning', from, to),
    latestQuantity('HKQuantityTypeIdentifierRestingHeartRate', from, to),
    latestQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', from, to),
    latestQuantity('HKQuantityTypeIdentifierOxygenSaturation', from, to),
    sumQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', from, to),
    sumQuantity('HKQuantityTypeIdentifierBasalEnergyBurned', from, to),
    sleepMinutes(from, to),
  ]);

  return {
    date: todayKey(),
    source: 'healthkit',
    steps: round(steps),
    distanceKm: distanceMeters != null ? +(distanceMeters / 1000).toFixed(2) : undefined,
    restingHeartRate: round(restHr),
    hrvSdnn: round(hrv),
    spo2: spo2 != null ? Math.round(spo2 * 100) : undefined,
    activeEnergyKcal: round(active),
    basalEnergyKcal: round(basal),
    sleepMinutes: round(sleep),
  };
}
