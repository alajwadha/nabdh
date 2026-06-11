import type { HealthDaily } from '@nabdh/shared';
import { todayKey } from '../services/health';

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
