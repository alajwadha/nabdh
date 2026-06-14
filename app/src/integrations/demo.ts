import type { HealthDaily } from '@nabdh/shared';
import { todayKey } from '../services/health';

// Single source of truth for the demo identity, shown until a real signed-in
// profile loads. Screens read from here instead of hardcoding "Ali" / "A".
export const DEMO_IDENTITY = {
  firstName: 'Ali',
  fullName: 'Ali Alajwad',
  initial: 'A',
  goal: 'Recover & lose 4 kg by Eid',
  foodStreakDays: 12,
};

// Dev-only sample data so the dashboard UI is not empty before a real device
// connects. Never used in production builds (gated behind __DEV__ in the UI).
export const DEMO_SUMMARY: HealthDaily = {
  date: todayKey(),
  source: 'fitbit',
  steps: 8432,
  distanceKm: 6.1,
  restingHeartRate: 58,
  hrvSdnn: 48,
  spo2: 98,
  sleepMinutes: 437,
  activeEnergyKcal: 612,
  basalEnergyKcal: 1480,
};
