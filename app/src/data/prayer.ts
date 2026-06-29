// Prayer times. The single source the prayer strip, day planner, fasting timer and Ramadan
// screens read from. The synchronous values default to demo times for Riyadh so the pure
// helpers and unit tests stay node-runnable; refreshPrayerTimes() computes real times from
// the device location (via the adhan library) on launch and updates them in place.
//
// adhan and expo-location are lazy-required inside functions only, never at module top level,
// so importing this module in plain node (ts-jest) never pulls in native/ESM-only code.

import type { IconName } from '../components/Icon';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type Prayer = { key: PrayerKey; label: string; time: string; icon: IconName }; // time = "HH:MM" 24h
export type PrayerSource = 'location' | 'demo';

const DEMO: Record<PrayerKey, string> = { fajr: '04:12', dhuhr: '11:54', asr: '15:18', maghrib: '18:42', isha: '20:12' };
let current: Record<PrayerKey, string> = { ...DEMO };
let source: PrayerSource = 'demo';

const META: { key: PrayerKey; label: string; icon: IconName }[] = [
  { key: 'fajr', label: 'Fajr', icon: 'sunrise' },
  { key: 'dhuhr', label: 'Dhuhr', icon: 'sun' },
  { key: 'asr', label: 'Asr', icon: 'sun-medium' },
  { key: 'maghrib', label: 'Maghrib', icon: 'sunset' },
  { key: 'isha', label: 'Isha', icon: 'moon-star' },
];

// The objects stay stable; `.time` reads the live cache so consumers don't need a new API.
export const PRAYERS: Prayer[] = META.map((m) => ({
  key: m.key,
  label: m.label,
  icon: m.icon,
  get time() {
    return current[m.key];
  },
}));

export function prayerTime(key: PrayerKey): string {
  return current[key] ?? '00:00';
}

export function prayerSource(): PrayerSource {
  return source;
}

/** Compact 12-hour label without the AM/PM suffix (for the dense prayer strip): "3:18". */
export function shortLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, '0')}`;
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

// --- live updates (subscription so screens re-render when times change) ---
const subs = new Set<() => void>();
let version = 0;
export function subscribePrayer(cb: () => void): () => void {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}
export function prayerVersion(): number {
  return version;
}
function commit(times: Record<PrayerKey, string>, src: PrayerSource): void {
  current = times;
  source = src;
  version += 1;
  subs.forEach((f) => f());
}

/** Compute today's 5 prayer times from coordinates using the Umm al-Qura method (Gulf).
 * Returns "HH:MM" device-local strings, or null if the library or data is unavailable. */
export function computePrayerTimes(lat: number, lon: number, date: Date = new Date()): Record<PrayerKey, string> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adhan = require('adhan');
    const coords = new adhan.Coordinates(lat, lon);
    const params = adhan.CalculationMethod.UmmAlQura();
    const pt = new adhan.PrayerTimes(coords, date, params);
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const times: Record<PrayerKey, string> = { fajr: fmt(pt.fajr), dhuhr: fmt(pt.dhuhr), asr: fmt(pt.asr), maghrib: fmt(pt.maghrib), isha: fmt(pt.isha) };
    for (const v of Object.values(times)) if (!/^\d\d:\d\d$/.test(v)) return null;
    return times;
  } catch {
    return null;
  }
}

const STORE_KEY = 'nabdh.prayer.coords';

function asyncStorage(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

/** Recompute today's times from previously-saved coordinates, for an instant non-demo start. */
export async function loadCachedPrayerTimes(): Promise<void> {
  const AsyncStorage = asyncStorage();
  if (!AsyncStorage) return;
  try {
    const v = await AsyncStorage.getItem(STORE_KEY);
    if (!v) return;
    const c = JSON.parse(v);
    if (typeof c?.lat === 'number' && typeof c?.lon === 'number') {
      const t = computePrayerTimes(c.lat, c.lon);
      if (t) commit(t, 'location');
    }
  } catch {
    /* stay on demo */
  }
}

/** Ask for location, compute today's times, persist the coordinates. Silent demo fallback. */
export async function refreshPrayerTimes(): Promise<PrayerSource> {
  let Location: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Location = require('expo-location');
  } catch {
    Location = null;
  }
  if (!Location) return source;
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!(perm?.granted || perm?.status === 'granted')) return source;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy?.Balanced ?? 3 });
    const { latitude, longitude } = pos.coords;
    const t = computePrayerTimes(latitude, longitude);
    if (!t) return source;
    commit(t, 'location');
    const AsyncStorage = asyncStorage();
    if (AsyncStorage) AsyncStorage.setItem(STORE_KEY, JSON.stringify({ lat: latitude, lon: longitude })).catch(() => {});
    return 'location';
  } catch {
    return source;
  }
}
