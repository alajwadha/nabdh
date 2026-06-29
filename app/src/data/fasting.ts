// Intermittent-fasting + Ramadan eating-window logic. Pure & unit-testable.
//
// Two modes:
//  - A clock-free PLAN (16:8 etc): the user starts a fast; we cycle fasting→eating from
//    that start using the plan's hour split.
//  - RAMADAN: windows are fixed by the clock, fasting from Fajr to Maghrib, eating from
//    Maghrib to the next Fajr, so no manual start is needed.

import { atClock, prayerTime } from './prayer';

export type FastPlan = { key: string; name: string; fastHours: number; eatHours: number; note: string };

export const PLANS: FastPlan[] = [
  { key: '14:10', name: '14:10', fastHours: 14, eatHours: 10, note: 'Gentle start, finish dinner a little earlier.' },
  { key: '16:8', name: '16:8', fastHours: 16, eatHours: 8, note: 'The popular one, skip breakfast, eat 12-8.' },
  { key: '18:6', name: '18:6', fastHours: 18, eatHours: 6, note: 'Tighter window for a stronger effect.' },
  { key: '20:4', name: '20:4', fastHours: 20, eatHours: 4, note: 'Warrior-style, one main eating block.' },
];

export const RAMADAN_PLAN: FastPlan = { key: 'ramadan', name: 'Ramadan', fastHours: 0, eatHours: 0, note: 'Suhoor to Fajr, then fast to Maghrib, windows follow prayer times.' };

export type Phase = 'fasting' | 'eating';
export type FastingState = {
  phase: Phase;
  startedAt: number; // ms, when the current phase began
  endsAt: number; // ms, when it flips
  progress: number; // 0..1 through the current phase
  secondsLeft: number;
};

export function planByKey(key: string): FastPlan {
  if (key === 'ramadan') return RAMADAN_PLAN;
  return PLANS.find((p) => p.key === key) ?? PLANS[1];
}

function state(phase: Phase, startedAt: number, endsAt: number, now: number): FastingState {
  const span = Math.max(1, endsAt - startedAt);
  const progress = Math.min(1, Math.max(0, (now - startedAt) / span));
  return { phase, startedAt, endsAt, progress, secondsLeft: Math.max(0, Math.round((endsAt - now) / 1000)) };
}

/** Plan mode: derive the current phase from when the fast was started. */
export function planState(plan: FastPlan, startMs: number, now = Date.now()): FastingState {
  const cycle = (plan.fastHours + plan.eatHours) * 3600000;
  const into = ((now - startMs) % cycle + cycle) % cycle; // ms into the current cycle
  const fastMs = plan.fastHours * 3600000;
  if (into < fastMs) {
    const phaseStart = now - into;
    return state('fasting', phaseStart, phaseStart + fastMs, now);
  }
  const phaseStart = now - (into - fastMs);
  return state('eating', phaseStart, phaseStart + plan.eatHours * 3600000, now);
}

/** Ramadan mode: windows come straight from today's Fajr/Maghrib (clock-driven). */
export function ramadanState(now = Date.now()): FastingState {
  const today = new Date(now);
  const fajr = atClock(prayerTime('fajr'), today).getTime();
  const maghrib = atClock(prayerTime('maghrib'), today).getTime();
  if (now < fajr) {
    // Pre-dawn: still in the overnight eating window that began at yesterday's Maghrib.
    const yMaghrib = atClock(prayerTime('maghrib'), new Date(now - 86400000)).getTime();
    return state('eating', yMaghrib, fajr, now);
  }
  if (now < maghrib) {
    // Daytime fast.
    return state('fasting', fajr, maghrib, now);
  }
  // After Maghrib: eating until tomorrow's Fajr.
  const tFajr = atClock(prayerTime('fajr'), new Date(now + 86400000)).getTime();
  return state('eating', maghrib, tFajr, now);
}

export function fastingState(planKey: string, startMs: number | null, now = Date.now()): FastingState {
  if (planKey === 'ramadan') return ramadanState(now);
  return planState(planByKey(planKey), startMs ?? now, now);
}

export function fmtCountdown(secs: number): string {
  const t = Math.max(0, secs);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
