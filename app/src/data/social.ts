// Social layer: a friends leaderboard ranked by the week's active minutes, plus
// group challenges you can join. Data is mock/seed for now (no backend yet) but the
// shapes are real so wiring a server later is a drop-in.
import type { IconName } from '../components/Icon';

export type Friend = {
  id: string;
  name: string;
  minutes: number; // active minutes this week
  streak: number; // day streak
  you?: boolean;
};

export type Challenge = {
  id: string;
  title: string;
  blurb: string;
  icon: IconName;
  tint: 'mint' | 'blue' | 'peach' | 'lav' | 'gold' | 'pink';
  unit: string; // e.g. 'min', 'km', 'workouts'
  goal: number;
  progress: number; // your progress toward goal
  daysLeft: number;
  participants: number;
};

// Seeded friends (you included), ranked client-side by weekly minutes.
export const FRIENDS: Friend[] = [
  { id: 'you', name: 'You', minutes: 248, streak: 6, you: true },
  { id: 'f1', name: 'Layla Haddad', minutes: 312, streak: 11 },
  { id: 'f2', name: 'Omar Nasser', minutes: 205, streak: 3 },
  { id: 'f3', name: 'Sara Kassab', minutes: 287, streak: 8 },
  { id: 'f4', name: 'Yousef Amir', minutes: 164, streak: 2 },
  { id: 'f5', name: 'Hana Rahimi', minutes: 96, streak: 1 },
];

export const CHALLENGES: Challenge[] = [
  { id: 'c1', title: 'June Move Streak', blurb: 'Log 30 active minutes a day, all month.', icon: 'flame', tint: 'peach', unit: 'days', goal: 30, progress: 22, daysLeft: 2, participants: 48 },
  { id: 'c2', title: '100 km Together', blurb: 'A team push to cover 100 km of walking & running.', icon: 'footprints', tint: 'blue', unit: 'km', goal: 100, progress: 63, daysLeft: 9, participants: 12 },
  { id: 'c3', title: 'Strong September', blurb: 'Hit 16 strength sessions before the month ends.', icon: 'dumbbell', tint: 'mint', unit: 'workouts', goal: 16, progress: 5, daysLeft: 21, participants: 34 },
  { id: 'c4', title: 'Mindful Mornings', blurb: 'Ten 5-minute breathing sessions this week.', icon: 'wind', tint: 'lav', unit: 'sessions', goal: 10, progress: 4, daysLeft: 4, participants: 27 },
];

/** Friends sorted by weekly minutes, highest first (the leaderboard order). */
export function leaderboard(friends: Friend[]): Friend[] {
  return [...friends].sort((a, b) => b.minutes - a.minutes);
}

/** Your 1-based position in the ranking. */
export function myRank(friends: Friend[]): number {
  return leaderboard(friends).findIndex((f) => f.you) + 1;
}

/** Initials for an avatar bubble. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
