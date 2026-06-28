import type { WorkoutSession } from '../store/workouts';

// Richer health calculations. Headline: the acute:chronic workload ratio (ACWR),
// the sports-science measure behind Whoop/Athlytic/Gentler-Streak "strain" — it
// compares this week's load to your 4-week base. 0.8–1.3 is the injury "sweet
// spot"; spiking above ~1.5 is where overuse risk climbs. Transparent so the
// detailed view can show the formula.

const DAY = 86400000;

export type LoadStatus = 'building' | 'detrained' | 'optimal' | 'caution' | 'high';

/**
 * One session's load in comparable units. Sport uses kcal directly; gym tonnage
 * is scaled to a kcal-equivalent (÷12) so a typical hard gym day (~5,000 kg →
 * ~420) lands near a typical cardio session (~400 kcal) rather than being
 * drowned out. A rough internal-load proxy, not a metabolic measurement.
 */
export function sessionLoad(s: WorkoutSession): number {
  if (s.kind === 'sport') return s.kcal ?? 0;
  return Math.round((s.volume ?? 0) / 12);
}

export type Acwr = {
  acute: number; // last 7 days total load
  chronic: number; // average weekly load over the PRIOR 3 weeks (decoupled from acute)
  ratio: number;
  hasRatio: boolean; // false until there's enough chronic baseline to compute a ratio
  status: LoadStatus;
  label: string;
  note: string;
};

export function computeAcwr(sessions: WorkoutSession[], now: number): Acwr {
  const ageDays = (iso: string) => (now - Date.parse(iso)) / DAY;
  const valid = sessions.filter((s) => ageDays(s.at) >= 0); // ignore future-dated/skewed
  const acute = valid.filter((s) => ageDays(s.at) <= 7).reduce((sum, s) => sum + sessionLoad(s), 0);
  // Chronic EXCLUDES the acute week (days 8–28) so the ratio actually decouples.
  const chronicTotal = valid
    .filter((s) => ageDays(s.at) > 7 && ageDays(s.at) <= 28)
    .reduce((sum, s) => sum + sessionLoad(s), 0);
  const chronic = Math.round(chronicTotal / 3); // average weekly load over the prior 3 weeks

  const base = { acute, chronic };
  if (acute === 0 && chronic === 0)
    return { ...base, ratio: 0, hasRatio: false, status: 'building', label: 'No load yet', note: 'Log a few workouts and your training load builds here.' };
  if (chronic === 0)
    return { ...base, ratio: 0, hasRatio: false, status: 'building', label: 'Building base', note: 'Keep logging — your baseline forms over the first weeks, then this shows your injury-safe zone.' };

  const ratio = acute / chronic;
  let status: LoadStatus;
  let label: string;
  let note: string;
  if (ratio < 0.8) {
    status = 'detrained'; label = 'Detraining';
    note = 'You’re doing less than your recent norm — fine for a deload, but fitness fades if it lasts.';
  } else if (ratio <= 1.3) {
    status = 'optimal'; label = 'Sweet spot';
    note = 'This week matches your recent base — the safest zone for steady gains.';
  } else if (ratio <= 1.5) {
    status = 'caution'; label = 'Ramping fast';
    note = 'Loading above your base. Fine briefly, but protect recovery this week.';
  } else {
    status = 'high'; label = 'Spike — ease off';
    note = 'Acute load is well above your base — where overuse risk climbs. Add a lighter day.';
  }
  return { ...base, ratio: Math.round(ratio * 100) / 100, hasRatio: true, status, label, note };
}

// --- Bonus calculators (used by detail views / future screens) --------------

/** Tanaka age-predicted max heart rate (more accurate than 220−age). */
export function maxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

export type HrZone = { z: number; lo: number; hi: number; name: string };
export function hrZones(age: number): HrZone[] {
  const m = maxHr(age);
  const p = (f: number) => Math.round(m * f);
  const z: HrZone[] = [
    { z: 1, lo: p(0.5), hi: p(0.6), name: 'Recovery' },
    { z: 2, lo: p(0.6), hi: p(0.7), name: 'Endurance' },
    { z: 3, lo: p(0.7), hi: p(0.8), name: 'Tempo' },
    { z: 4, lo: p(0.8), hi: p(0.9), name: 'Threshold' },
    { z: 5, lo: p(0.9), hi: m, name: 'VO₂ max' },
  ];
  for (let i = 1; i < z.length; i++) z[i].lo = z[i - 1].hi + 1; // non-overlapping bands
  return z;
}

/** Strength relative to bodyweight (e1RM ÷ bodyweight) — a factual ratio, lift-agnostic. */
export function relativeStrength(e1rm: number, bodyweightKg: number): number {
  return bodyweightKg > 0 ? Math.round((e1rm / bodyweightKg) * 100) / 100 : 0;
}

export function bmi(weightKg: number, heightCm: number): { value: number; band: string } {
  const v = heightCm > 0 ? weightKg / (heightCm / 100) ** 2 : 0;
  const band = v < 18.5 ? 'Underweight' : v < 25 ? 'Healthy' : v < 30 ? 'Overweight' : 'Obese';
  return { value: Math.round(v * 10) / 10, band };
}

/** Resting energy via Mifflin–St Jeor (the most accurate common BMR equation). */
export function bmr(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const s = sex === 'female' ? -161 : 5;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
}

export type ActivityLevel = { key: string; label: string; factor: number };
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { key: 'sedentary', label: 'Sedentary', factor: 1.2 },
  { key: 'light', label: 'Light', factor: 1.375 },
  { key: 'moderate', label: 'Moderate', factor: 1.55 },
  { key: 'active', label: 'Active', factor: 1.725 },
  { key: 'athlete', label: 'Athlete', factor: 1.9 },
];

/** Total daily energy expenditure = BMR × activity factor. */
export function tdee(bmrValue: number, factor: number): number {
  return Math.round(bmrValue * factor);
}
