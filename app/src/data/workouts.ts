import type { HealthDaily } from '@nabdh/shared';

// Workout calculations + catalogs. The numbers here are the moat vs Hevy/Strong/
// Fitbod/JEFIT: those log lifts and estimate 1RM/volume, but none adjust today's
// training to your recovery. Nabdh does (adjustForReadiness below).
//
// Calorie math uses the compendium MET model: kcal = MET × weightKg × hours.
// 1RM uses Epley/Brzycki. All transparent so the "detailed" view can show the why.

export const DEFAULT_WEIGHT_KG = 80;

export type Equipment = 'machine' | 'barbell' | 'dumbbell' | 'cable' | 'bodyweight';
export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'glutes';

export type Exercise = {
  key: string;
  name: string;
  nameAr: string;
  muscle: Muscle;
  equipment: Equipment;
  emoji: string;
};

export type SetEntry = { weight: number; reps: number };

export type Sport = {
  key: string;
  name: string;
  nameAr: string;
  met: number; // metabolic equivalent (moderate effort)
  emoji: string;
  gps?: boolean; // distance-based (running, cycling…)
  indoor?: boolean; // typically played indoors/AC, don't assume Gulf outdoor heat
};

// --- 1RM estimators ---------------------------------------------------------
export function epley(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}
export function brzycki(weight: number, reps: number): number {
  return reps <= 1 ? weight : reps >= 37 ? weight : (weight * 36) / (37 - reps);
}
/** Estimated 1RM, average of Epley & Brzycki, rounded to 0.5 kg. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return Math.round(((epley(weight, reps) + brzycki(weight, reps)) / 2) * 2) / 2;
}
export function bestE1rm(sets: SetEntry[]): number {
  return sets.reduce((best, s) => Math.max(best, e1rm(s.weight, s.reps)), 0);
}
/** Total volume load = Σ weight × reps. */
export function volume(sets: SetEntry[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
export function totalReps(sets: SetEntry[]): number {
  return sets.reduce((sum, s) => sum + s.reps, 0);
}

// --- Calorie / MET model ----------------------------------------------------
/** kcal = MET × weightKg × hours. */
export function metCalories(met: number, minutes: number, weightKg = DEFAULT_WEIGHT_KG): number {
  return Math.round(met * weightKg * (minutes / 60));
}

/**
 * Estimated sweat / fluid loss for a session (litres). Sweat rate scales with
 * metabolic heat (MET) and body mass, and climbs sharply in Gulf outdoor heat -
 * a flat number would badly under-serve a padel match at 42 °C. Grounded in ACSM
 * ranges (~0.5 L/hr easy → ~1.5-2 L/hr vigorous; heat pushes higher). An estimate,
 * not a substitute for weighing in/out.
 */
export function sweatLossLiters(met: number, minutes: number, weightKg = DEFAULT_WEIGHT_KG, hot = false): number {
  const ratePerHr = Math.max(0.3, Math.min(2.5, 0.3 + (met - 3) * 0.18)) * (weightKg / 75) * (hot ? 1.35 : 1);
  return Math.round(ratePerHr * (minutes / 60) * 10) / 10;
}

/**
 * Fluid to drink to rehydrate after a session, in 250 ml glasses. ACSM guidance is
 * to replace ~1.5× the fluid lost (urine losses during recovery), spread over hours.
 */
export function rehydrationGlasses(litersLost: number): number {
  return Math.max(0, Math.round((litersLost * 1.5 * 1000) / 250));
}
/**
 * Running MET from pace (min/km), ACSM running equation:
 * VO2 (ml/kg/min) = 0.2 × speed(m/min) + 3.5, MET = VO2 / 3.5.
 * speed(m/min) = 1000 / pace ⇒ MET ≈ 57.1/pace + 1.
 * e.g. 5:00/km → 12.4, 6:00/km → 10.5, 4:00/km → 15.3.
 */
export function runningMet(paceMinPerKm: number): number {
  if (paceMinPerKm <= 0) return 9.8;
  return Math.min(20, Math.max(6, 57.1 / paceMinPerKm + 1));
}
/** Riegel race-time prediction: T2 = T1 × (D2/D1)^1.06 (the standard endurance model). */
export function riegelTime(t1Min: number, d1Km: number, d2Km: number): number {
  return d1Km > 0 ? t1Min * Math.pow(d2Km / d1Km, 1.06) : 0;
}

/** Rough distance (km) for a steady-pace cardio session. */
export function distanceKm(minutes: number, paceMinPerKm: number): number {
  return paceMinPerKm > 0 ? Math.round((minutes / paceMinPerKm) * 10) / 10 : 0;
}

/**
 * Daniels-style training paces (sec/km) from a recent run. We project the effort
 * to an equivalent 5 K time with the same Riegel model used for race prediction,
 * then scale 5 K pace by the standard zone multipliers (easy slower, intervals at
 * 5 K pace, reps faster). Approximate VDOT, a guide built from one real run, not
 * a lab test. Returns null if the reference run is too short to be meaningful.
 */
export type TrainingPace = { key: string; label: string; secPerKm: number; note: string };
export function trainingPaces(refDistanceKm: number, refMinutes: number): TrainingPace[] | null {
  if (refDistanceKm < 1.5 || refMinutes <= 0) return null; // need a real, sustained effort
  const fiveKmin = riegelTime(refMinutes, refDistanceKm, 5);
  const p5 = (fiveKmin * 60) / 5; // 5 K-equivalent pace, sec/km
  const zones: { key: string; label: string; mult: number; note: string }[] = [
    { key: 'easy', label: 'Easy / recovery', mult: 1.25, note: 'Conversational base miles' },
    { key: 'long', label: 'Long run', mult: 1.18, note: 'Endurance, run-feel relaxed' },
    { key: 'marathon', label: 'Marathon', mult: 1.10, note: 'Steady race-day effort' },
    { key: 'threshold', label: 'Threshold / tempo', mult: 1.05, note: 'Comfortably hard, ~1 hr pace' },
    { key: 'interval', label: 'Interval (VO₂)', mult: 0.98, note: '3-5 min reps at ~5 K pace' },
    { key: 'rep', label: 'Reps / speed', mult: 0.95, note: 'Short, fast, full recovery' },
  ];
  return zones.map((z) => ({ key: z.key, label: z.label, secPerKm: Math.round(p5 * z.mult), note: z.note }));
}

/** Format a sec/km pace as m:ss /km. */
export function fmtPace(secPerKm: number): string {
  if (secPerKm <= 0) return '-';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Readiness-adjusted training (the differentiator) -----------------------
export type LoadAdvice = {
  factor: number; // multiply target load by this
  tone: 'rest' | 'easy' | 'steady' | 'push';
  label: string;
  note: string;
};
/**
 * Recovery readiness 0-100 from sleep + resting HR + HRV. ONE shared definition
 * so Today, the Workout screen, and the insight hero never disagree. Neutral 64
 * when there's no data to weight.
 */
export function computeReadiness(s: HealthDaily | null): number {
  if (!s) return 64;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  let score = 0;
  let weight = 0;
  if (s.sleepMinutes != null) { score += clamp(s.sleepMinutes / 450) * 40; weight += 40; }
  if (s.restingHeartRate != null) { score += clamp((70 - s.restingHeartRate) / 16) * 30; weight += 30; }
  if (s.hrvSdnn != null) { score += clamp(s.hrvSdnn / 70) * 30; weight += 30; }
  return weight === 0 ? 64 : Math.round((score / weight) * 100);
}

export type ReadinessFactor = {
  key: 'sleep' | 'rhr' | 'hrv';
  label: string;
  weight: number; // share of the score (sleep 40, RHR 30, HRV 30)
  present: boolean;
  pct: number | null; // sub-score 0-100 for this signal
  points: number; // points this signal contributes to the final 0-100 score
  value: string; // human-readable measured value
  status: 'good' | 'warn' | 'bad' | 'none';
};

/**
 * Transparent decomposition of the readiness score, the SAME sleep/RHR/HRV inputs
 * and weights computeReadiness uses, so the breakdown always reconciles with the
 * headline number (no fabricated contributors). Points are each signal's share of
 * the final 0-100 score; with all three present they sum to the score.
 */
export function readinessBreakdown(s: HealthDaily | null): { score: number; factors: ReadinessFactor[] } {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const band = (p: number | null): ReadinessFactor['status'] =>
    p == null ? 'none' : p >= 70 ? 'good' : p >= 45 ? 'warn' : 'bad';
  const defs = [
    { key: 'sleep' as const, label: 'Sleep', weight: 40, sub: s?.sleepMinutes != null ? clamp(s.sleepMinutes / 450) : null,
      value: s?.sleepMinutes != null ? `${Math.floor(s.sleepMinutes / 60)}h ${s.sleepMinutes % 60}m` : 'No data' },
    { key: 'rhr' as const, label: 'Resting HR', weight: 30, sub: s?.restingHeartRate != null ? clamp((70 - s.restingHeartRate) / 16) : null,
      value: s?.restingHeartRate != null ? `${s.restingHeartRate} bpm` : 'No data' },
    { key: 'hrv' as const, label: 'HRV', weight: 30, sub: s?.hrvSdnn != null ? clamp(s.hrvSdnn / 70) : null,
      value: s?.hrvSdnn != null ? `${s.hrvSdnn} ms` : 'No data' },
  ];
  const totalWeight = defs.reduce((w, d) => w + (d.sub != null ? d.weight : 0), 0);
  const score = computeReadiness(s);

  // Points per signal, allocated by largest-remainder so they sum EXACTLY to the
  // headline score (independent rounding would otherwise drift, e.g. 39+23+21=83 vs 82).
  const present = defs.filter((d) => d.sub != null);
  const raw = present.map((d) => (d.sub! * d.weight / totalWeight) * 100);
  const pts = raw.map(Math.floor);
  let rem = (totalWeight > 0 ? score : 0) - pts.reduce((a, b) => a + b, 0);
  const byFrac = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rem > 0 && k < byFrac.length; k++, rem--) pts[byFrac[k].i]++;
  for (let k = byFrac.length - 1; rem < 0 && k >= 0; k--, rem++) pts[byFrac[k].i] = Math.max(0, pts[byFrac[k].i] - 1);
  const pointsByKey: Partial<Record<ReadinessFactor['key'], number>> = {};
  present.forEach((d, i) => { pointsByKey[d.key] = pts[i]; });

  const factors: ReadinessFactor[] = defs.map((d) => {
    const pct = d.sub != null ? Math.round(d.sub * 100) : null;
    return { key: d.key, label: d.label, weight: d.weight, present: d.sub != null, pct, points: pointsByKey[d.key] ?? 0, value: d.value, status: band(pct) };
  });
  return { score, factors };
}

export function adjustForReadiness(readiness: number): LoadAdvice {
  if (readiness < 50)
    return { factor: 0, tone: 'rest', label: 'Recover today', note: 'Readiness is low, swap lifting for mobility or an easy walk. Lifting now costs more than it gives.' };
  if (readiness < 65)
    return { factor: 0.9, tone: 'easy', label: 'Go ~10% lighter', note: 'Trim load ~10% and cut a set. Keep the movement, protect the recovery.' };
  if (readiness < 80)
    return { factor: 1.0, tone: 'steady', label: 'Train as planned', note: 'You\'re in a solid window, hit your normal working weights.' };
  return { factor: 1.05, tone: 'push', label: 'Green light, push', note: 'Recovery is high. Add ~5% or a top set and chase a PR.' };
}
/** Suggest a working weight from a known 1RM at a target rep range. */
export function workingWeight(oneRm: number, reps: number, factor = 1): number {
  // Epley inverse: load = 1RM / (1 + reps/30)
  const base = oneRm / (1 + reps / 30);
  return Math.round(base * factor * 2) / 2;
}

/**
 * %1RM training-load table, maps common training intensities to a working weight
 * and the reps that intensity typically allows (Epley inverse: reps ≈ 30·(1/pct-1)).
 * The staple programming reference in Strong/Boostcamp/Hevy. Weights round to 2.5 kg.
 */
export function percentLoads(oneRm: number): { pct: number; kg: number; reps: number }[] {
  if (oneRm <= 0) return [];
  const pcts = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65];
  return pcts.map((p) => ({
    pct: Math.round(p * 100),
    kg: Math.round((oneRm * p) / 2.5) * 2.5,
    reps: Math.max(1, Math.round(30 * (1 / p - 1))),
  }));
}

/** Smallest sensible load jump, bigger on big lower-body & deadlift, small on isolation. */
export function progressionIncrement(muscle: Muscle, exKey?: string): number {
  if (exKey === 'deadlift') return 5;
  return muscle === 'legs' || muscle === 'glutes' ? 5 : 2.5;
}

/** Exercise-appropriate working rep range: compounds run lower, machines/isolation higher. */
export function repRange(equipment: string): { floor: number; ceil: number } {
  if (equipment === 'barbell') return { floor: 5, ceil: 8 };
  if (equipment === 'machine' || equipment === 'cable') return { floor: 8, ceil: 15 };
  return { floor: 6, ceil: 12 }; // dumbbell & everything else
}

export type NextTarget = {
  weight: number; reps: number; action: 'increase' | 'hold';
  workingWeight: number; limiterReps: number; repFloor: number; repCeil: number;
};
/**
 * Double-progression vs your last session (Hevy/Strong/Boostcamp model). We anchor on
 * the WORKING set, the most-used weight (mode), or the median weight when every set
 * differs, not whatever single set was heaviest, so a top single/backoff doesn't drive
 * the suggestion. Add weight only once EVERY working set clears the top of the range
 * (the limiter = the weakest working set); otherwise hold and chase one more rep.
 * Not readiness-adjusted, the readiness card handles today's push/ease-off.
 */
export function suggestProgression(
  sets: SetEntry[],
  increment: number,
  repFloor = 6,
  repCeil = 10,
): NextTarget | null {
  const valid = sets.filter((s) => s.weight > 0 && s.reps > 0);
  if (!valid.length) return null;

  // Working weight: the most-frequently used weight (ties → heaviest); if all unique, the median.
  const counts = new Map<number, number>();
  valid.forEach((s) => counts.set(s.weight, (counts.get(s.weight) ?? 0) + 1));
  const maxCount = Math.max(...counts.values());
  let workingWeight: number;
  if (maxCount > 1) {
    workingWeight = Math.max(...[...counts.entries()].filter(([, c]) => c === maxCount).map(([w]) => w));
  } else {
    const uniq = [...new Set(valid.map((s) => s.weight))].sort((a, b) => a - b);
    workingWeight = uniq[Math.floor((uniq.length - 1) / 2)];
  }

  const repsAtWorking = valid.filter((s) => s.weight === workingWeight).map((s) => s.reps);
  const limiterReps = Math.min(...repsAtWorking); // weakest working set gates progression
  if (limiterReps >= repCeil)
    return { weight: Math.round((workingWeight + increment) / 2.5) * 2.5, reps: repFloor, action: 'increase', workingWeight, limiterReps, repFloor, repCeil };
  return { weight: workingWeight, reps: limiterReps + 1, action: 'hold', workingWeight, limiterReps, repFloor, repCeil };
}

/** Rest-between-sets guidance from the working rep range (heavier/fewer → longer rest). */
export function restRecommendation(reps: number): string {
  if (reps <= 0) return '';
  if (reps <= 5) return '3-5 min · strength';
  if (reps <= 12) return '60-90 s · hypertrophy';
  return '30-60 s · endurance';
}

/** Plates to load PER SIDE for a target barbell total (greedy, standard kg plates). */
export function platesPerSide(totalKg: number, barKg = 20): number[] {
  let perSide = (totalKg - barKg) / 2;
  if (perSide <= 0) return [];
  const avail = [25, 20, 15, 10, 5, 2.5, 1.25];
  const out: number[] = [];
  for (const p of avail) {
    while (perSide >= p - 1e-9) {
      out.push(p);
      perSide -= p;
    }
  }
  return out;
}

/**
 * Warm-up ramp up to a top working weight. Barbell (barKg>0): empty bar → 50% →
 * 70% → 85%. Machine/dumbbell (barKg=0, no empty-bar concept): 40% → 60% → 80%.
 * Rounded to 2.5 kg, strictly increasing.
 */
export function warmupRamp(topKg: number, barKg = 20): { weight: number; reps: number }[] {
  const minW = barKg > 0 ? barKg : 2.5;
  if (topKg <= minW) return [];
  const round = (w: number) => Math.max(minW, Math.round(w / 2.5) * 2.5);
  const steps =
    barKg > 0
      ? [
          { weight: barKg, reps: 8 },
          { weight: round(topKg * 0.5), reps: 5 },
          { weight: round(topKg * 0.7), reps: 3 },
          { weight: round(topKg * 0.85), reps: 1 },
        ]
      : [
          { weight: round(topKg * 0.4), reps: 8 },
          { weight: round(topKg * 0.6), reps: 5 },
          { weight: round(topKg * 0.8), reps: 3 },
        ];
  return steps.filter((w, i, a) => i === 0 || w.weight > a[i - 1].weight);
}

// --- Catalogs ---------------------------------------------------------------
export const EXERCISES: Exercise[] = [
  { key: 'legpress', name: 'Leg press', nameAr: 'دفع الأرجل', muscle: 'legs', equipment: 'machine', emoji: '🦵' },
  { key: 'chestpress', name: 'Chest press (machine)', nameAr: 'دفع الصدر', muscle: 'chest', equipment: 'machine', emoji: '🫁' },
  { key: 'latpull', name: 'Lat pulldown', nameAr: 'سحب علوي', muscle: 'back', equipment: 'cable', emoji: '🔙' },
  { key: 'legext', name: 'Leg extension', nameAr: 'تمديد الساق', muscle: 'legs', equipment: 'machine', emoji: '🦿' },
  { key: 'legcurl', name: 'Leg curl', nameAr: 'ثني الساق', muscle: 'legs', equipment: 'machine', emoji: '🦵' },
  { key: 'shoulderpress', name: 'Shoulder press', nameAr: 'دفع الكتف', muscle: 'shoulders', equipment: 'machine', emoji: '💪' },
  { key: 'seatedrow', name: 'Seated cable row', nameAr: 'تجديف جالس', muscle: 'back', equipment: 'cable', emoji: '🚣' },
  { key: 'squat', name: 'Barbell squat', nameAr: 'سكوات', muscle: 'legs', equipment: 'barbell', emoji: '🏋️' },
  { key: 'deadlift', name: 'Deadlift', nameAr: 'رفعة مميتة', muscle: 'back', equipment: 'barbell', emoji: '🏋️' },
  { key: 'bench', name: 'Bench press', nameAr: 'بنش بريس', muscle: 'chest', equipment: 'barbell', emoji: '🏋️' },
  { key: 'ohp', name: 'Overhead press', nameAr: 'ضغط علوي', muscle: 'shoulders', equipment: 'barbell', emoji: '🏋️' },
  { key: 'dbcurl', name: 'Dumbbell curl', nameAr: 'مرجحة بايسبس', muscle: 'arms', equipment: 'dumbbell', emoji: '💪' },
  { key: 'triext', name: 'Triceps pushdown', nameAr: 'دفع تراي', muscle: 'arms', equipment: 'cable', emoji: '💪' },
  { key: 'pullup', name: 'Pull-up', nameAr: 'عقلة', muscle: 'back', equipment: 'bodyweight', emoji: '🤸' },
  { key: 'pushup', name: 'Push-up', nameAr: 'ضغط', muscle: 'chest', equipment: 'bodyweight', emoji: '🤸' },
  { key: 'plank', name: 'Plank', nameAr: 'بلانك', muscle: 'core', equipment: 'bodyweight', emoji: '🧘' },
  { key: 'hipthrust', name: 'Hip thrust', nameAr: 'دفع الورك', muscle: 'glutes', equipment: 'barbell', emoji: '🍑' },
  { key: 'calfraise', name: 'Calf raise', nameAr: 'رفع السمانة', muscle: 'legs', equipment: 'machine', emoji: '🦵' },
];

export const SPORTS: Sport[] = [
  { key: 'padel', name: 'Padel', nameAr: 'بادل', met: 7.0, emoji: '🎾' },
  { key: 'tennis', name: 'Tennis', nameAr: 'تنس', met: 7.3, emoji: '🎾' },
  { key: 'running', name: 'Running', nameAr: 'جري', met: 9.8, emoji: '🏃', gps: true },
  { key: 'walking', name: 'Walking', nameAr: 'مشي', met: 3.5, emoji: '🚶', gps: true },
  { key: 'cycling', name: 'Cycling', nameAr: 'دراجة', met: 7.5, emoji: '🚴', gps: true },
  { key: 'swimming', name: 'Swimming', nameAr: 'سباحة', met: 7.0, emoji: '🏊', indoor: true },
  { key: 'football', name: 'Football', nameAr: 'كرة قدم', met: 7.0, emoji: '⚽' },
  { key: 'basketball', name: 'Basketball', nameAr: 'سلة', met: 6.5, emoji: '🏀', indoor: true },
  { key: 'hiit', name: 'HIIT', nameAr: 'هيت', met: 8.0, emoji: '🔥', indoor: true },
  { key: 'jumprope', name: 'Jump rope', nameAr: 'حبل', met: 11.0, emoji: '🪢', indoor: true },
  { key: 'squash', name: 'Squash', nameAr: 'إسكواش', met: 12.0, emoji: '🎾', indoor: true },
  { key: 'boxing', name: 'Boxing', nameAr: 'ملاكمة', met: 9.0, emoji: '🥊', indoor: true },
  { key: 'yoga', name: 'Yoga', nameAr: 'يوغا', met: 2.5, emoji: '🧘', indoor: true },
  { key: 'rowing', name: 'Rowing', nameAr: 'تجديف', met: 7.0, emoji: '🚣', indoor: true },
];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', glutes: 'Glutes',
};
