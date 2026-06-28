import type { HealthDaily } from '@nabdh/shared';

// Real derivation helpers shared by the screens so every view reflects the same
// underlying HealthDaily summary instead of hardcoded numbers. Works for live
// device data and the dev demo summary alike.

/** "7:17" from a minute count. */
export function hoursMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export type SleepStages = {
  deep: number;
  rem: number;
  light: number;
  awake: number;
  inBedMin: number;
};

/**
 * Split total time-asleep into stages using typical adult proportions
 * (deep ~19%, REM ~25%, light the remainder) plus a small awake allowance.
 * Deterministic, so the breakdown always reconciles with the headline duration.
 */
export function sleepStages(asleepMin: number): SleepStages {
  const deep = Math.round(asleepMin * 0.19);
  const rem = Math.round(asleepMin * 0.25);
  const light = Math.max(0, asleepMin - deep - rem);
  const awake = Math.round(asleepMin * 0.06);
  return { deep, rem, light, awake, inBedMin: asleepMin + awake };
}

/** 0–100 sleep score from duration (vs 7.5h) nudged by deep+REM share. */
export function sleepScore(asleepMin: number): number {
  if (asleepMin <= 0) return 0;
  const duration = 60 + (asleepMin - 360) / 4.5; // 6h→60, 7.5h→80
  const { deep, rem } = sleepStages(asleepMin);
  const structureBonus = ((deep + rem) / asleepMin - 0.4) * 40; // reward ≥40% deep+REM
  return Math.max(0, Math.min(100, Math.round(duration + structureBonus)));
}

/** Estimate bedtime/wake clock strings from in-bed minutes, anchored to a 7:00 wake. */
export function sleepWindow(inBedMin: number, wakeHour = 7): { bed: string; wake: string } {
  const wake = wakeHour * 60;
  let bed = wake - inBedMin;
  if (bed < 0) bed += 24 * 60;
  const clock = (mins: number) => {
    const h24 = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    const ampm = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  return { bed: clock(bed), wake: clock(wake) };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today's weekday name (e.g. "Saturday"). */
export function weekdayName(d = new Date()): string {
  return WEEKDAYS[d.getDay()];
}

/** "JUN 8 – JUN 14" for the 7-day window ending today. */
export function weekRangeLabel(d = new Date()): string {
  const end = d;
  const start = new Date(d);
  start.setDate(d.getDate() - 6);
  const fmt = (x: Date) => `${MONTHS[x.getMonth()].toUpperCase()} ${x.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Age-personalized sleep need in minutes (National Sleep Foundation bands). */
export function sleepNeedMin(age: number): number {
  if (age <= 13) return 9 * 60; // school-age/early teen 9–11h
  if (age <= 17) return 8.5 * 60; // teens 8–10h
  if (age >= 65) return 7.5 * 60; // older adults 7–8h
  return 8 * 60; // adults 7–9h → target 8h
}

/** Active-energy ring progress against a goal. */
export function energyProgress(s: HealthDaily | null, goal = 600): number {
  return Math.max(0, Math.min(1, (s?.activeEnergyKcal ?? 0) / goal));
}
