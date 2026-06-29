// Menstrual-cycle math, pure + testable. Phases follow the standard model: the luteal phase
// is ~14 days, so ovulation ≈ cycleLength - 14; the fertile window is the 5 days before
// ovulation plus the day itself. Tasteful + clinical, used by the cycle screen and readiness.

export type Period = { start: string; end?: string }; // 'YYYY-MM-DD'
export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const DEFAULT_CYCLE = 28;
export const DEFAULT_PERIOD = 5;

export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(s: string, n: number): string {
  const d = parseDay(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);
}

/** Average gap between consecutive period starts (falls back to 28 with <2 periods). */
export function averageCycle(periods: Period[]): number {
  const starts = periods.map((p) => p.start).sort();
  if (starts.length < 2) return DEFAULT_CYCLE;
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) gaps.push(daysBetween(starts[i - 1], starts[i]));
  const valid = gaps.filter((g) => g >= 18 && g <= 45); // ignore implausible gaps
  if (!valid.length) return DEFAULT_CYCLE;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

/** Average period length from start→end pairs (falls back to 5). */
export function averagePeriod(periods: Period[]): number {
  const lens = periods.filter((p) => p.end).map((p) => daysBetween(p.start, p.end!) + 1).filter((l) => l >= 1 && l <= 10);
  if (!lens.length) return DEFAULT_PERIOD;
  return Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
}

export type CycleInfo = {
  lastStart: string;
  cycleLen: number;
  periodLen: number;
  day: number; // 1-based cycle day today
  phase: Phase;
  ovulationDay: number; // cycle day of ovulation
  fertile: [number, number]; // [startDay, endDay] inclusive
  nextStart: string;
  daysUntilNext: number;
};

export function phaseForDay(day: number, cycleLen: number, periodLen: number): Phase {
  const ovulation = Math.max(periodLen + 2, cycleLen - 14);
  if (day <= periodLen) return 'menstrual';
  if (day >= ovulation - 1 && day <= ovulation + 1) return 'ovulation';
  if (day < ovulation - 1) return 'follicular';
  return 'luteal';
}

export function cycleInfo(periods: Period[], today = dayKey()): CycleInfo | null {
  const starts = periods.map((p) => p.start).sort();
  const lastStart = starts[starts.length - 1];
  if (!lastStart) return null;
  const cycleLen = averageCycle(periods);
  const periodLen = averagePeriod(periods);
  // cycle day; if we're past the predicted next start, roll forward (period may be late/unlogged)
  let day = daysBetween(lastStart, today) + 1;
  if (day < 1) day = 1;
  const ovulationDay = Math.max(periodLen + 2, cycleLen - 14);
  const wrapped = ((day - 1) % cycleLen) + 1;
  const phase = phaseForDay(wrapped, cycleLen, periodLen);
  const nextStart = addDays(lastStart, cycleLen);
  return {
    lastStart,
    cycleLen,
    periodLen,
    day: wrapped,
    phase,
    ovulationDay,
    fertile: [Math.max(1, ovulationDay - 5), ovulationDay + 1],
    nextStart,
    daysUntilNext: daysBetween(today, nextStart),
  };
}

export const PHASE_META: Record<Phase, { label: string; color: string; note: string; train: string }> = {
  menstrual: { label: 'Menstrual', color: '#C2562C', note: 'Bleed phase, energy is often lower.', train: 'Keep it easy: light movement, walks, mobility. Listen to your body.' },
  follicular: { label: 'Follicular', color: '#2E7D5B', note: 'Estrogen rising, energy and recovery climb.', train: 'Great window for hard sessions and strength PRs.' },
  ovulation: { label: 'Ovulation', color: '#C9A227', note: 'Peak estrogen, strength often peaks too.', train: 'Prime time for a heavy lift or a fast effort.' },
  luteal: { label: 'Luteal', color: '#4A3F9E', note: 'Progesterone up, fatigue and warmth rise.', train: 'Prioritize recovery; moderate volume, more rest, extra hydration.' },
};
