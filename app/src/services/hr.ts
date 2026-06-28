// Pure heart-rate training-zone math — no native imports, unit-testable.
// Zones are the standard 5-zone %HRmax model (calm → warm).

export type Zone = {
  key: string;
  name: string;
  loPct: number; // fraction of HRmax (inclusive lower bound)
  hiPct: number;
  color: string;
  desc: string;
};

// Colours are deepened enough that white text/digits sit on them with AA contrast, while
// still reading as a calm→warm gradient. Large zone-coloured *text* is avoided in the UI
// (it can't pass contrast on both the light and dark card), so these are used for fills,
// bars and the small numbered tiles only.
export const ZONES: Zone[] = [
  { key: 'z1', name: 'Recovery', loPct: 0.5, hiPct: 0.6, color: '#3E7B9C', desc: 'Very light — warm-up & active recovery' },
  { key: 'z2', name: 'Easy', loPct: 0.6, hiPct: 0.7, color: '#2F8158', desc: 'Fat-burning base endurance' },
  { key: 'z3', name: 'Aerobic', loPct: 0.7, hiPct: 0.8, color: '#8C6C18', desc: 'Builds cardio fitness & stamina' },
  { key: 'z4', name: 'Threshold', loPct: 0.8, hiPct: 0.9, color: '#BC5A24', desc: 'Hard — raises your lactate threshold' },
  { key: 'z5', name: 'Max', loPct: 0.9, hiPct: 1.0, color: '#B03A2A', desc: 'All-out — short bursts only' },
];

/** Age-predicted max heart rate (220 − age), floored so silly ages don't break ranges. */
export function maxHrFromAge(age: number): number {
  return Math.max(120, Math.round(220 - age));
}

/** The bpm range [lo, hi] for a zone at a given HRmax. */
export function zoneBpm(z: Zone, maxHr: number): { lo: number; hi: number } {
  return { lo: Math.round(z.loPct * maxHr), hi: Math.round(z.hiPct * maxHr) };
}

/** Which zone (0–4) a heart rate falls in. Anything below Z1 is clamped to Z1,
 * anything at/above Z5 to Z5, so every measured beat lands in a zone. */
export function zoneIndexForHr(hr: number, maxHr: number): number {
  const pct = hr / maxHr;
  for (let i = ZONES.length - 1; i >= 1; i--) {
    if (pct >= ZONES[i].loPct) return i;
  }
  return 0;
}

/** Seconds spent in each zone from a series of HR samples (default 1 s apart). */
export function timeInZones(samples: number[], maxHr: number, sampleSecs = 1): number[] {
  const secs = [0, 0, 0, 0, 0];
  for (const hr of samples) secs[zoneIndexForHr(hr, maxHr)] += sampleSecs;
  return secs;
}

export function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Percent of HRmax, rounded — for the "82% max" readout. */
export function pctOfMax(hr: number, maxHr: number): number {
  return maxHr > 0 ? Math.round((hr / maxHr) * 100) : 0;
}
