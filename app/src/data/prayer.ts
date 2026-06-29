// Prayer times, the single source the fasting timer (and, later, the prayer-aware planner)
// reads from. These are static demo times for Riyadh; TODO: compute from device location
// with a standard algorithm or fetch from a local prayer-times service.

import type { IconName } from '../components/Icon';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type Prayer = { key: PrayerKey; label: string; time: string; icon: IconName }; // time = "HH:MM" 24h

export const PRAYERS: Prayer[] = [
  { key: 'fajr', label: 'Fajr', time: '04:12', icon: 'sunrise' },
  { key: 'dhuhr', label: 'Dhuhr', time: '11:54', icon: 'sun' },
  { key: 'asr', label: 'Asr', time: '15:18', icon: 'sun-medium' },
  { key: 'maghrib', label: 'Maghrib', time: '18:42', icon: 'sunset' },
  { key: 'isha', label: 'Isha', time: '20:12', icon: 'moon-star' },
];

/** Compact 12-hour label without the AM/PM suffix (for the dense prayer strip): "3:18". */
export function shortLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, '0')}`;
}

export function prayerTime(key: PrayerKey): string {
  return PRAYERS.find((p) => p.key === key)?.time ?? '00:00';
}

/** Build a Date for "HH:MM" on the same calendar day as `base`. */
export function atClock(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

/** Pretty 12-hour label, e.g. "6:42 PM". */
export function clockLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${ap}`;
}
