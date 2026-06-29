// Unit system (metric / imperial). The store keeps everything in SI/metric
// internally; we convert ONLY at the display layer (render) and when reading a
// stepper nudge back into metric. These helpers are pure and node-testable.

export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const KM_PER_MI = 1.609344;
export const CM_PER_IN = 2.54;
export const ML_PER_OZ = 29.5735295625;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kmToMi = (km: number) => km / KM_PER_MI;
export const miToKm = (mi: number) => mi * KM_PER_MI;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const mlToOz = (ml: number) => ml / ML_PER_OZ;

/** Metric delta that nudges a value by ONE unit in the active display system,
 * so a stepper feels native (1 lb / 1 in) while the store stays in kg / cm. */
export const weightStepKg = (s: UnitSystem) => (s === 'imperial' ? KG_PER_LB : 1);
export const heightStepCm = (s: UnitSystem) => (s === 'imperial' ? CM_PER_IN : 1);

type VU = { value: string; unit: string };

/** Body weight, whole-number in the active unit (the ±estimate doesn't justify decimals). */
export function displayWeight(kg: number, s: UnitSystem): VU {
  return s === 'imperial'
    ? { value: String(Math.round(kgToLb(kg))), unit: 'lb' }
    : { value: String(Math.round(kg)), unit: 'kg' };
}

/** Weight with decimals (for the weight-log trend where 0.1 matters). */
export function displayWeightPrecise(kg: number, s: UnitSystem, decimals = 1): VU {
  const v = s === 'imperial' ? kgToLb(kg) : kg;
  return { value: v.toFixed(decimals), unit: s === 'imperial' ? 'lb' : 'kg' };
}

/** Height: metric whole cm; imperial feet + inches as one token e.g. 5'9". */
export function displayHeight(cm: number, s: UnitSystem): VU {
  if (s !== 'imperial') return { value: String(Math.round(cm)), unit: 'cm' };
  const totalIn = Math.round(cmToIn(cm));
  let ft = Math.floor(totalIn / 12);
  let inch = totalIn % 12;
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { value: `${ft}'${inch}"`, unit: '' };
}

/** A girth measurement (waist/neck/hip), whole cm or whole inches. */
export function displayLength(cm: number, s: UnitSystem): VU {
  return s === 'imperial'
    ? { value: String(Math.round(cmToIn(cm))), unit: 'in' }
    : { value: String(Math.round(cm)), unit: 'cm' };
}

/** Distance in km, two decimals, as km or miles. */
export function displayDistance(km: number, s: UnitSystem): VU {
  return s === 'imperial'
    ? { value: kmToMi(km).toFixed(2), unit: 'mi' }
    : { value: km.toFixed(2), unit: 'km' };
}

export const distanceUnit = (s: UnitSystem) => (s === 'imperial' ? 'MILES' : 'KILOMETRES');
export const speedUnit = (s: UnitSystem) => (s === 'imperial' ? 'MPH' : 'KM/H');

/** Speed given km/h, one decimal, km/h or mph. */
export function displaySpeed(kmh: number, s: UnitSystem): string {
  return (s === 'imperial' ? kmh / KM_PER_MI : kmh).toFixed(1);
}

const mmss = (secs: number) => {
  const m = Math.floor(secs / 60);
  const ss = Math.round(secs % 60);
  // carry a rounded-up 60s remainder
  return ss === 60 ? `${m + 1}:00` : `${m}:${String(ss).padStart(2, '0')}`;
};

/** Pace given seconds-per-km. Returns m:ss and the unit label (/km or /mi). */
export function displayPace(secPerKm: number, s: UnitSystem): VU {
  if (!secPerKm || !Number.isFinite(secPerKm)) return { value: '--', unit: s === 'imperial' ? '/mi' : '/km' };
  const secs = s === 'imperial' ? secPerKm * KM_PER_MI : secPerKm;
  return { value: mmss(secs), unit: s === 'imperial' ? '/mi' : '/km' };
}

/** Temperature given Celsius, rounded whole degrees in the active unit. */
export function displayTemp(c: number, s: UnitSystem): string {
  return `${Math.round(s === 'imperial' ? cToF(c) : c)}°`;
}

/** A daily water volume given litres: metric "X.X L", imperial whole "NN oz". */
export function displayVolume(liters: number, s: UnitSystem): VU {
  return s === 'imperial'
    ? { value: String(Math.round(mlToOz(liters * 1000))), unit: 'oz' }
    : { value: liters.toFixed(1), unit: 'L' };
}
