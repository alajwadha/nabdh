// Guided breathing patterns. Each is a repeating sequence of phases; the screen animates a
// circle (expand on inhale, hold, contract on exhale) and counts each phase down.

export type BreathKind = 'inhale' | 'hold' | 'exhale';
export type BreathStep = { kind: BreathKind; secs: number; label: string };
export type BreathPattern = { key: string; name: string; note: string; steps: BreathStep[] };

const I = (s: number): BreathStep => ({ kind: 'inhale', secs: s, label: 'Inhale' });
const H = (s: number): BreathStep => ({ kind: 'hold', secs: s, label: 'Hold' });
const E = (s: number): BreathStep => ({ kind: 'exhale', secs: s, label: 'Exhale' });

export const PATTERNS: BreathPattern[] = [
  { key: 'box', name: 'Box', note: 'Even 4-4-4-4, steady focus & calm.', steps: [I(4), H(4), E(4), H(4)] },
  { key: '478', name: '4-7-8', note: 'Long exhale, wind down for sleep.', steps: [I(4), H(7), E(8)] },
  { key: 'coherence', name: 'Coherence', note: '5-5, balances heart-rate variability.', steps: [I(5), E(5)] },
  { key: 'relax', name: 'Relax', note: '4-6, a longer exhale eases stress.', steps: [I(4), E(6)] },
];

export const DURATIONS = [1, 3, 5] as const; // minutes

export function patternByKey(key: string): BreathPattern {
  return PATTERNS.find((p) => p.key === key) ?? PATTERNS[0];
}

// One full cycle's length, for nicely rounding to whole cycles if ever needed.
export function cycleSecs(p: BreathPattern): number {
  return p.steps.reduce((a, s) => a + s.secs, 0);
}
