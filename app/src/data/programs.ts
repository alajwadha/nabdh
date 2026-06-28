// Starter workout programs — ordered exercise lists the in-workout session runner walks
// through. Keys reference EXERCISES in ./workouts (each has a MoveViz figure + calculations).

export type Program = {
  key: string;
  name: string;
  emoji: string;
  note: string;
  /** ordered exercise keys (must exist in EXERCISES) */
  exKeys: string[];
};

export const PROGRAMS: Program[] = [
  {
    key: 'fullbody',
    name: 'Full body',
    emoji: '🔁',
    note: 'A balanced session hitting every major muscle — great 3×/week.',
    exKeys: ['squat', 'bench', 'seatedrow', 'shoulderpress', 'dbcurl', 'plank'],
  },
  {
    key: 'push',
    name: 'Push day',
    emoji: '⬆️',
    note: 'Chest, shoulders, triceps — the press half of a Push/Pull/Legs split.',
    exKeys: ['bench', 'shoulderpress', 'chestpress', 'triext', 'pushup'],
  },
  {
    key: 'pull',
    name: 'Pull day',
    emoji: '⬇️',
    note: 'Back and biceps — the pull half of Push/Pull/Legs.',
    exKeys: ['latpull', 'seatedrow', 'pullup', 'dbcurl'],
  },
  {
    key: 'legs',
    name: 'Leg day',
    emoji: '🦵',
    note: 'Quads, hamstrings, glutes and calves — the legs half of PPL.',
    exKeys: ['squat', 'legpress', 'legext', 'legcurl', 'hipthrust', 'calfraise'],
  },
];

export function programByKey(key: string): Program | undefined {
  return PROGRAMS.find((p) => p.key === key);
}

/** Rest-timer seconds from the reps just logged (heavier/fewer reps → longer rest). */
export function restSeconds(reps: number): number {
  if (reps <= 0) return 60;
  if (reps <= 5) return 180; // strength
  if (reps <= 12) return 90; // hypertrophy
  return 45; // endurance
}
