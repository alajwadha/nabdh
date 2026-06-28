import type { WorkoutSession } from '../store/workouts';
import type { Muscle } from './workouts';

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

/**
 * Strength standards — classifies a lift's estimated 1RM against population norms
 * by bodyweight multiple, the way StrengthLevel / ExRx / Symmetric Strength do.
 * Thresholds are the *entry* bodyweight-ratio for each level and are approximate
 * population figures (men's barbell; women's set ~0.65–0.75× per the same sources),
 * so we only classify the four lifts with well-established norms — others return
 * null and the UI shows nothing rather than fabricating a level.
 */
export type StrengthLevel = 'untrained' | 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite';
export const STRENGTH_LEVELS: StrengthLevel[] = ['untrained', 'beginner', 'novice', 'intermediate', 'advanced', 'elite'];

// Entry ratios for beginner / novice / intermediate / advanced / elite (×bodyweight).
const STRENGTH_STANDARDS: Record<string, { male: number[]; female: number[] }> = {
  squat: { male: [0.75, 1.25, 1.5, 2.0, 2.75], female: [0.5, 0.75, 1.25, 1.5, 2.0] },
  bench: { male: [0.5, 0.75, 1.0, 1.5, 2.0], female: [0.25, 0.5, 0.75, 1.0, 1.5] },
  deadlift: { male: [1.0, 1.5, 2.0, 2.5, 3.0], female: [0.5, 1.0, 1.25, 1.75, 2.5] },
  ohp: { male: [0.35, 0.55, 0.8, 1.1, 1.4], female: [0.2, 0.35, 0.5, 0.75, 1.0] },
};

export type StrengthStanding = {
  level: StrengthLevel;
  ratio: number; // e1RM ÷ bodyweight
  // The next level up and the e1RM (kg) needed to reach it — null once at elite.
  next: { level: StrengthLevel; kg: number } | null;
};

export function strengthStandard(
  exerciseKey: string,
  e1rm: number,
  bodyweightKg: number,
  sex: 'male' | 'female',
): StrengthStanding | null {
  const std = STRENGTH_STANDARDS[exerciseKey];
  if (!std || e1rm <= 0 || bodyweightKg <= 0) return null;
  const cuts = std[sex];
  const ratio = e1rm / bodyweightKg;
  // How many thresholds we've cleared → index into the level list (0 = untrained).
  let cleared = 0;
  for (const c of cuts) if (ratio >= c) cleared++;
  const level = STRENGTH_LEVELS[cleared];
  // Only read the next entry ratio when there IS a level above (avoids cuts[5]=undefined at elite).
  const next =
    cleared < cuts.length
      ? { level: STRENGTH_LEVELS[cleared + 1], kg: Math.ceil(cuts[cleared] * bodyweightKg) }
      : null;
  return { level, ratio: Math.round(ratio * 100) / 100, next };
}

/**
 * Daily water goal in 250 ml glasses. Base ~35 ml/kg, +~3 ml/kg per activity
 * level above sedentary, +25% for Gulf heat — because a flat temperate constant
 * under-serves an active user training outdoors in a Saudi summer. Clamped 6–16.
 */
export function hydrationGlasses(weightKg: number, activityFactor = 1.2, hot = false): number {
  const perKg = 35 + ((activityFactor - 1.2) / 0.175) * 3;
  const ml = weightKg * perKg * (hot ? 1.25 : 1);
  return Math.max(6, Math.min(16, Math.round(ml / 250)));
}

/**
 * DOTS strength score — normalizes a powerlifting total (kg) for bodyweight & sex
 * so lifters of different sizes compare fairly. ~300 = solid trained, 500+ elite.
 * Coefficients: the 2020 DOTS polynomial.
 */
export function dotsScore(totalKg: number, bodyweightKg: number, sex: 'male' | 'female'): number {
  if (totalKg <= 0 || bodyweightKg <= 0) return 0;
  const c =
    sex === 'female'
      ? [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706659]
      : [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000000207624];
  const bw = Math.min(Math.max(bodyweightKg, 40), 210); // polynomial valid ~40–210 kg
  const denom = c[0] + c[1] * bw + c[2] * bw ** 2 + c[3] * bw ** 3 + c[4] * bw ** 4;
  return denom !== 0 ? Math.round((500 / denom) * totalKg) : 0;
}

/** Estimated VO₂max (ml/kg/min) from the HR ratio — Uth–Sørensen–Overgaard–Pedersen (2004). */
export function vo2maxEstimate(maxHr: number, restingHr: number): number {
  if (restingHr <= 0) return 0;
  return Math.round(15.3 * (maxHr / restingHr));
}

/**
 * Cardio-fitness band, age/sex-adjusted (VO₂max declines ~4 ml/kg per decade, and
 * female norms run lower) so a fit older user isn't mislabeled "fair".
 */
export function vo2Band(v: number, age = 30, sex: 'male' | 'female' = 'male'): string {
  const adj = (age - 30) * 0.4 + (sex === 'female' ? 6 : 0); // older/female → lower thresholds
  const t = (x: number) => x - adj;
  return v >= t(52) ? 'excellent' : v >= t(44) ? 'very good' : v >= t(36) ? 'good' : v >= t(30) ? 'fair' : 'below average';
}

export function bmi(weightKg: number, heightCm: number): { value: number; band: string } {
  const v = heightCm > 0 ? weightKg / (heightCm / 100) ** 2 : 0;
  const band = v < 18.5 ? 'Underweight' : v < 25 ? 'Healthy' : v < 30 ? 'Overweight' : 'Obese';
  return { value: Math.round(v * 10) / 10, band };
}

/**
 * Waist-to-height ratio — a cardiometabolic risk marker that captures the fat
 * *distribution* BMI misses (central/visceral fat). NICE and Ashwell back the
 * simple "keep your waist under half your height" rule (boundary 0.5; ≥0.6 high
 * risk). Sex-independent, and a better risk predictor than BMI for most adults.
 */
export function whtr(waistCm: number, heightCm: number): { value: number; band: string; note: string } {
  const v = heightCm > 0 && waistCm > 0 ? waistCm / heightCm : 0;
  // The validated NICE/Ashwell three-band set: healthy <0.5, increased <0.6, high ≥0.6.
  let band: string;
  let note: string;
  if (v < 0.5) { band = 'Healthy'; note = 'Your waist is under half your height — the healthy zone.'; }
  else if (v < 0.6) { band = 'Increased risk'; note = 'Above the half-height line — trimming the waist lowers metabolic risk.'; }
  else { band = 'High risk'; note = 'Well above half your height — central fat raises heart & metabolic risk.'; }
  return { value: Math.round(v * 100) / 100, band, note };
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

/** Single source for an activity key → factor (so store + UI can't diverge). */
export function resolveActivityFactor(key: string): number {
  return ACTIVITY_LEVELS.find((a) => a.key === key)?.factor ?? 1.55;
}

/** Total daily energy expenditure = BMR × activity factor. */
export function tdee(bmrValue: number, factor: number): number {
  return Math.round(bmrValue * factor);
}

export type Goal = 'maintain' | 'cut' | 'gain';

/**
 * Daily calorie target from TDEE and goal, floored at a safe minimum so an
 * aggressive deficit never recommends a dangerous intake (~1,200 F / 1,500 M).
 * −500/day ≈ −0.5 kg/week; +300 ≈ a lean gain.
 */
export function calorieBudget(tdeeValue: number, goal: Goal, sex: 'male' | 'female'): number {
  const delta = goal === 'cut' ? -500 : goal === 'gain' ? 300 : 0;
  const floor = sex === 'female' ? 1200 : 1500;
  return Math.max(floor, tdeeValue + delta);
}

/**
 * Goal-weight ETA from the planned daily energy delta. ~7,700 kcal ≈ 1 kg of body
 * mass, so weekly rate = delta×7 / 7700. Honest about the cases the plan can't reach
 * (e.g. wanting to lose while in a surplus). A steady-rate estimate — real loss is
 * rarely linear, so the UI frames it as "at this rate", not a promise.
 */
export type GoalProjection = {
  reachable: boolean; // false when the energy delta points the wrong way for the target
  atTarget: boolean;
  weeks: number;
  weeklyRateKg: number; // signed: negative = losing
  kgToGo: number; // signed: target − current
};
export function goalProjection(currentKg: number, targetKg: number, energyDeltaPerDay: number): GoalProjection | null {
  if (currentKg <= 0 || targetKg <= 0) return null;
  const kgToGo = Math.round((targetKg - currentKg) * 10) / 10;
  const weeklyRateKg = Math.round((energyDeltaPerDay * 7 / 7700) * 100) / 100;
  if (Math.abs(kgToGo) < 0.3) return { reachable: true, atTarget: true, weeks: 0, weeklyRateKg, kgToGo };
  if (weeklyRateKg === 0 || Math.sign(kgToGo) !== Math.sign(weeklyRateKg))
    return { reachable: false, atTarget: false, weeks: 0, weeklyRateKg, kgToGo };
  return { reachable: true, atTarget: false, weeks: Math.round((kgToGo / weeklyRateKg) * 10) / 10, weeklyRateKg, kgToGo };
}

/** Daily protein target per kg bodyweight — higher on a cut to spare muscle. */
export function proteinPerKgTarget(goal: Goal): number {
  return goal === 'cut' ? 2.0 : goal === 'gain' ? 1.8 : 1.6;
}

/**
 * Daily macro targets (grams) from bodyweight + budget. Protein is set per kg
 * (higher on a cut to spare muscle), fat at 25% of calories, carbs fill the rest.
 */
export function macroTargets(
  weightKg: number,
  budgetKcal: number,
  goal: Goal,
): { protein: number; carbs: number; fat: number } {
  const protein = Math.round(weightKg * proteinPerKgTarget(goal));
  const fat = Math.round((budgetKcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((budgetKcal - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

/**
 * Daily fibre target (g) — the Institute of Medicine's 14 g per 1,000 kcal, scaled
 * to the user's own energy budget rather than a flat one-size number.
 */
export function fiberTarget(budgetKcal: number): number {
  return Math.round((budgetKcal / 1000) * 14);
}

/** Share of consumed energy from each macro (%), for the macro-split readout. */
export function macroEnergySplit(
  proteinG: number,
  carbsG: number,
  fatG: number,
): { protein: number; carbs: number; fat: number } {
  const kcal = proteinG * 4 + carbsG * 4 + fatG * 9;
  if (kcal <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((proteinG * 4 * 100) / kcal),
    carbs: Math.round((carbsG * 4 * 100) / kcal),
    fat: Math.round((fatG * 9 * 100) / kcal),
  };
}

/**
 * Training balance from recent WORKING-SET COUNTS by muscle (not tonnage — leg/back
 * loads are inherently heavier, which would bias a kg-based split toward "lower").
 * A set is effort-comparable across muscles. Two ratios that matter:
 *  • Push (chest+shoulders) vs Pull (back) — desk-bound users under-pull, which
 *    rounds the shoulders; the common cue is to pull at least as much as you push.
 *  • Upper vs Lower — flags the classic skipped-leg-day imbalance.
 * Returns 'unknown' until there's volume on a side, so we never scold someone for a
 * partial week. Arms are left out of push/pull (we don't split biceps vs triceps)
 * but counted in Upper, since the upper/lower split doesn't need that distinction.
 */
export type BalanceStatus = 'balanced' | 'pushDominant' | 'pullDominant' | 'lowerLagging' | 'upperLagging' | 'unknown';
export type TrainingBalance = {
  push: number; pull: number; pushPullStatus: BalanceStatus; pushPullNote: string;
  upper: number; lower: number; lowerPct: number; upperLowerStatus: BalanceStatus; upperLowerNote: string;
};

export function trainingBalance(vol: Partial<Record<Muscle, number>>): TrainingBalance {
  const g = (m: Muscle) => vol[m] ?? 0;
  const push = g('chest') + g('shoulders');
  const pull = g('back');
  const upper = g('chest') + g('back') + g('shoulders') + g('arms');
  const lower = g('legs') + g('glutes');

  // Push vs pull — need volume on both sides to judge a ratio.
  let pushPullStatus: BalanceStatus;
  let pushPullNote: string;
  if (push + pull === 0) {
    pushPullStatus = 'unknown'; pushPullNote = 'Log some upper-body work to see your push-to-pull balance.';
  } else if (pull === 0) {
    pushPullStatus = 'pushDominant'; pushPullNote = 'All push, no pull yet — add rows or pulldowns for shoulder health.';
  } else if (push === 0) {
    pushPullStatus = 'pullDominant'; pushPullNote = 'All pull, no press yet — add some pushing to round it out.';
  } else {
    const ratio = push / pull;
    if (ratio > 1.3) { pushPullStatus = 'pushDominant'; pushPullNote = 'Leans push-heavy — make sure rows, pulldowns and face-pulls keep pace for shoulder health.'; }
    else if (ratio < 0.7) { pushPullStatus = 'pullDominant'; pushPullNote = 'Pull-heavy — good for posture; keep some pressing in too.'; }
    else { pushPullStatus = 'balanced'; pushPullNote = 'Push and pull are well matched — great for shoulder health.'; }
  }

  // Upper vs lower — need total volume to judge the split.
  const total = upper + lower;
  const lowerPct = total > 0 ? Math.round((lower / total) * 100) : 0;
  let upperLowerStatus: BalanceStatus;
  let upperLowerNote: string;
  if (total === 0) {
    upperLowerStatus = 'unknown'; upperLowerNote = 'Log a few lifts to see your upper-to-lower split.';
  } else if (lowerPct < 35) {
    upperLowerStatus = 'lowerLagging'; upperLowerNote = `Legs are ${lowerPct}% of volume — don’t skip leg day.`;
  } else if (lowerPct > 65) {
    upperLowerStatus = 'upperLagging'; upperLowerNote = `Upper body is lagging at ${100 - lowerPct}% — add some pressing and pulling.`;
  } else {
    upperLowerStatus = 'balanced'; upperLowerNote = `Upper and lower are balanced (${lowerPct}% legs).`;
  }

  return { push, pull, pushPullStatus, pushPullNote, upper, lower, lowerPct, upperLowerStatus, upperLowerNote };
}
