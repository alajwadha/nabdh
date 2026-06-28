import type { WorkoutSession } from '../store/workouts';

// Richer health calculations. Headline: the acute:chronic workload ratio (ACWR),
// the sports-science measure behind Whoop/Athlytic/Gentler-Streak "strain" — it
// compares this week's load to your 4-week base. 0.8–1.3 is the injury "sweet
// spot"; spiking above ~1.5 is where overuse risk climbs. Transparent so the
// detailed view can show the formula.

const DAY = 86400000;

export type LoadStatus = 'detrained' | 'optimal' | 'caution' | 'high';

/** One session's load in comparable units (sport kcal, or gym tonnage ÷ 50). */
export function sessionLoad(s: WorkoutSession): number {
  if (s.kind === 'sport') return s.kcal ?? 0;
  return Math.round((s.volume ?? 0) / 50);
}

export type Acwr = {
  acute: number; // last 7 days total load
  chronic: number; // average weekly load over last 28 days
  ratio: number;
  status: LoadStatus;
  label: string;
  note: string;
};

export function computeAcwr(sessions: WorkoutSession[], now: number): Acwr {
  const within = (iso: string, days: number) => {
    const d = now - Date.parse(iso);
    return d >= 0 && d <= days * DAY;
  };
  const acute = sessions.filter((s) => within(s.at, 7)).reduce((sum, s) => sum + sessionLoad(s), 0);
  const chronicTotal = sessions.filter((s) => within(s.at, 28)).reduce((sum, s) => sum + sessionLoad(s), 0);
  const chronic = Math.round(chronicTotal / 4); // average weekly load across 4 weeks
  const ratio = chronic > 0 ? acute / chronic : acute > 0 ? 1.5 : 0;

  let status: LoadStatus;
  let label: string;
  let note: string;
  if (ratio === 0) {
    status = 'detrained'; label = 'No load yet';
    note = 'Log a few workouts and your training load builds here.';
  } else if (ratio < 0.8) {
    status = 'detrained'; label = 'Detraining';
    note = 'You’re doing less than your recent norm — fine for a deload, but fitness fades if it lasts.';
  } else if (ratio <= 1.3) {
    status = 'optimal'; label = 'Sweet spot';
    note = 'This week matches your 4-week base — the safest zone for steady gains.';
  } else if (ratio <= 1.5) {
    status = 'caution'; label = 'Ramping fast';
    note = 'Loading above your base. Fine briefly, but protect recovery this week.';
  } else {
    status = 'high'; label = 'Spike — ease off';
    note = 'Acute load is well above your base — where overuse risk climbs. Add a lighter day.';
  }
  return { acute, chronic, ratio: Math.round(ratio * 100) / 100, status, label, note };
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
  return [
    { z: 1, lo: p(0.5), hi: p(0.6), name: 'Recovery' },
    { z: 2, lo: p(0.6), hi: p(0.7), name: 'Endurance' },
    { z: 3, lo: p(0.7), hi: p(0.8), name: 'Tempo' },
    { z: 4, lo: p(0.8), hi: p(0.9), name: 'Threshold' },
    { z: 5, lo: p(0.9), hi: m, name: 'VO₂ max' },
  ];
}

export function bmi(weightKg: number, heightCm: number): { value: number; band: string } {
  const v = heightCm > 0 ? weightKg / (heightCm / 100) ** 2 : 0;
  const band = v < 18.5 ? 'Underweight' : v < 25 ? 'Healthy' : v < 30 ? 'Overweight' : 'Obese';
  return { value: Math.round(v * 10) / 10, band };
}
