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
};

// --- 1RM estimators ---------------------------------------------------------
export function epley(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}
export function brzycki(weight: number, reps: number): number {
  return reps <= 1 ? weight : reps >= 37 ? weight : (weight * 36) / (37 - reps);
}
/** Estimated 1RM — average of Epley & Brzycki, rounded to 0.5 kg. */
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
 * Running MET from pace (min/km), ACSM running equation:
 * VO2 (ml/kg/min) = 0.2 × speed(m/min) + 3.5, MET = VO2 / 3.5.
 * speed(m/min) = 1000 / pace ⇒ MET ≈ 57.1/pace + 1.
 * e.g. 5:00/km → 12.4, 6:00/km → 10.5, 4:00/km → 15.3.
 */
export function runningMet(paceMinPerKm: number): number {
  if (paceMinPerKm <= 0) return 9.8;
  return Math.min(20, Math.max(6, 57.1 / paceMinPerKm + 1));
}
/** Rough distance (km) for a steady-pace cardio session. */
export function distanceKm(minutes: number, paceMinPerKm: number): number {
  return paceMinPerKm > 0 ? Math.round((minutes / paceMinPerKm) * 10) / 10 : 0;
}

// --- Readiness-adjusted training (the differentiator) -----------------------
export type LoadAdvice = {
  factor: number; // multiply target load by this
  tone: 'rest' | 'easy' | 'steady' | 'push';
  label: string;
  note: string;
};
/**
 * Recovery readiness 0–100 from sleep + resting HR + HRV. ONE shared definition
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

export function adjustForReadiness(readiness: number): LoadAdvice {
  if (readiness < 50)
    return { factor: 0, tone: 'rest', label: 'Recover today', note: 'Readiness is low — swap lifting for mobility or an easy walk. Lifting now costs more than it gives.' };
  if (readiness < 65)
    return { factor: 0.9, tone: 'easy', label: 'Go ~10% lighter', note: 'Trim load ~10% and cut a set. Keep the movement, protect the recovery.' };
  if (readiness < 80)
    return { factor: 1.0, tone: 'steady', label: 'Train as planned', note: 'You\'re in a solid window — hit your normal working weights.' };
  return { factor: 1.05, tone: 'push', label: 'Green light — push', note: 'Recovery is high. Add ~5% or a top set and chase a PR.' };
}
/** Suggest a working weight from a known 1RM at a target rep range. */
export function workingWeight(oneRm: number, reps: number, factor = 1): number {
  // Epley inverse: load = 1RM / (1 + reps/30)
  const base = oneRm / (1 + reps / 30);
  return Math.round(base * factor * 2) / 2;
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

/** Warm-up ramp up to a top working weight: bar → 50% → 70% → 85%, rounded to 2.5 kg. */
export function warmupRamp(topKg: number, barKg = 20): { weight: number; reps: number }[] {
  if (topKg <= barKg) return [];
  const round = (w: number) => Math.max(barKg, Math.round(w / 2.5) * 2.5);
  return [
    { weight: barKg, reps: 8 },
    { weight: round(topKg * 0.5), reps: 5 },
    { weight: round(topKg * 0.7), reps: 3 },
    { weight: round(topKg * 0.85), reps: 1 },
  ].filter((w, i, a) => i === 0 || w.weight > a[i - 1].weight); // strictly increasing
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
  { key: 'swimming', name: 'Swimming', nameAr: 'سباحة', met: 7.0, emoji: '🏊' },
  { key: 'football', name: 'Football', nameAr: 'كرة قدم', met: 7.0, emoji: '⚽' },
  { key: 'basketball', name: 'Basketball', nameAr: 'سلة', met: 6.5, emoji: '🏀' },
  { key: 'hiit', name: 'HIIT', nameAr: 'هيت', met: 8.0, emoji: '🔥' },
  { key: 'jumprope', name: 'Jump rope', nameAr: 'حبل', met: 11.0, emoji: '🪢' },
  { key: 'squash', name: 'Squash', nameAr: 'إسكواش', met: 12.0, emoji: '🎾' },
  { key: 'boxing', name: 'Boxing', nameAr: 'ملاكمة', met: 9.0, emoji: '🥊' },
  { key: 'yoga', name: 'Yoga', nameAr: 'يوغا', met: 2.5, emoji: '🧘' },
  { key: 'rowing', name: 'Rowing', nameAr: 'تجديف', met: 7.0, emoji: '🚣' },
];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', glutes: 'Glutes',
};
