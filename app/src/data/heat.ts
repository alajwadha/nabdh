// Pure heat-coaching logic over a weather forecast — unit-testable, no I/O.
import type { WeatherHour } from '../services/weather';

export type HeatKey = 'low' | 'moderate' | 'high' | 'extreme';
export type HeatLevel = { key: HeatKey; label: string; color: string; advice: string };

/** Heat-risk band from the "feels like" temperature (apparent temp, °C). */
export function heatLevel(feelsC: number): HeatLevel {
  if (feelsC >= 43) return { key: 'extreme', label: 'Extreme', color: '#B03A2A', advice: 'Train indoors today — outdoor effort in this heat isn’t worth the risk.' };
  if (feelsC >= 38) return { key: 'high', label: 'High', color: '#BC5A24', advice: 'Keep outdoor sessions short and easy, and only in the cooler windows.' };
  if (feelsC >= 32) return { key: 'moderate', label: 'Moderate', color: '#8C6C18', advice: 'Fine to train outside — favour shade and the cooler hours, and hydrate well.' };
  return { key: 'low', label: 'Comfortable', color: '#2F8158', advice: 'Good conditions to be outside — enjoy the session.' };
}

export type Window = { startHour: number; endHour: number; feelsC: number; afterAsr: boolean };

/** The coolest ~2-hour outdoor window still ahead today, preferring hours after Asr.
 * Returns null if there are no future hours left. */
export function bestWindow(hours: WeatherHour[], nowHour: number, asrHour = 15): Window | null {
  const future = hours.filter((h) => h.hour >= nowHour);
  if (future.length === 0) return null;
  // Prefer the post-Asr cool-down; fall back to all remaining hours if Asr has passed.
  const pool = future.filter((h) => h.hour >= asrHour);
  const candidates = pool.length >= 1 ? pool : future;
  let best = candidates[0];
  for (const h of candidates) if (h.feelsC < best.feelsC) best = h;
  return {
    startHour: best.hour,
    endHour: Math.min(23, best.hour + 2),
    feelsC: best.feelsC,
    afterAsr: best.hour >= asrHour,
  };
}

/** Extra water (in 250 ml glasses) to add for a hot-weather outdoor session vs a neutral one. */
export function extraGlasses(extraLiters: number): number {
  return Math.max(0, Math.round(extraLiters / 0.25));
}

export function hourLabel(h: number): string {
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ap}`;
}
