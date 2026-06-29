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

/** 0-100 sleep score from duration (vs 7.5h) nudged by deep+REM share. */
export function sleepScore(asleepMin: number): number {
  if (asleepMin <= 0) return 0;
  const duration = 60 + (asleepMin - 360) / 4.5; // 6h→60, 7.5h→80
  const { deep, rem } = sleepStages(asleepMin);
  const structureBonus = ((deep + rem) / asleepMin - 0.4) * 40; // reward ≥40% deep+REM
  return Math.max(0, Math.min(100, Math.round(duration + structureBonus)));
}

/** 12-hour clock string for a minutes-from-midnight value (wraps past 24h). */
export function clockFromMins(mins: number): string {
  const norm = ((Math.round(mins) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(norm / 60) % 24;
  const m = norm % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Estimate bedtime/wake clock strings from in-bed minutes, anchored to a 7:00 wake. */
export function sleepWindow(inBedMin: number, wakeHour = 7): { bed: string; wake: string } {
  const wake = wakeHour * 60;
  // clockFromMins fully normalizes negatives, so no pre-guard needed.
  return { bed: clockFromMins(wake - inBedMin), wake: clockFromMins(wake) };
}

/**
 * Bedtimes that complete whole ~90-minute sleep cycles before a fixed wake time, so
 * you wake between cycles (light sleep) rather than mid-deep-sleep. Includes ~15 min
 * to fall asleep. Cycle length is an average (real cycles run 70-120 min), so this is
 * guidance, not a guarantee, but aligning to it is why "more sleep" can feel worse.
 */
export function cycleBedtimes(
  wakeHour = 7,
  cycleCounts = [6, 5, 4],
  latencyMin = 15,
  cycleMin = 90,
): { cycles: number; hours: number; time: string }[] {
  return cycleCounts.map((n) => ({
    cycles: n,
    hours: Math.round((n * cycleMin) / 60 * 10) / 10,
    time: clockFromMins(wakeHour * 60 - (n * cycleMin + latencyMin)),
  }));
}

/**
 * Evening wind-down cut-off times relative to a target bedtime. Caffeine has a
 * ~5-6 h half-life, so an afternoon karak/qahwa still has ~25% onboard at bedtime -
 * the Sleep Foundation advises stopping ~8 h before sleep. Heavy meals ~3 h before
 * (reflux/blood-sugar), and dimming screens ~1 h before (melatonin). All derived
 * from the bedtime, not invented data.
 */
export function windDownTimes(inBedMin: number, wakeHour = 7): { caffeine: string; meal: string; screens: string } {
  const bed = wakeHour * 60 - inBedMin;
  return {
    caffeine: clockFromMins(bed - 360), // 6 h before, the followable floor (8 h is ideal)
    meal: clockFromMins(bed - 180), // 3 h before
    screens: clockFromMins(bed - 60), // 1 h before
  };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today's weekday name (e.g. "Saturday"). */
export function weekdayName(d = new Date()): string {
  return WEEKDAYS[d.getDay()];
}

/** "JUN 8 - JUN 14" for the 7-day window ending today. */
export function weekRangeLabel(d = new Date()): string {
  const end = d;
  const start = new Date(d);
  start.setDate(d.getDate() - 6);
  const fmt = (x: Date) => `${MONTHS[x.getMonth()].toUpperCase()} ${x.getDate()}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

/** Age-personalized sleep need in minutes (National Sleep Foundation bands). */
export function sleepNeedMin(age: number): number {
  if (age <= 13) return 9 * 60; // school-age/early teen 9-11h
  if (age <= 17) return 8.5 * 60; // teens 8-10h
  if (age >= 65) return 7.5 * 60; // older adults 7-8h
  return 8 * 60; // adults 7-9h → target 8h
}

/** Active-energy ring progress against a goal. */
export function energyProgress(s: HealthDaily | null, goal = 600): number {
  return Math.max(0, Math.min(1, (s?.activeEnergyKcal ?? 0) / goal));
}
