import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bestE1rm, volume, type SetEntry } from '../data/workouts';

// Persisted workout history — the thing that turns the live calculator into a
// tracker. Sessions are stored locally (and can sync to the backend later).

export type WorkoutSession = {
  id: string;
  at: string; // ISO timestamp
  kind: 'gym' | 'sport';
  readiness?: number;
  // gym
  exKey?: string;
  sets?: SetEntry[];
  volume?: number;
  e1rm?: number;
  // sport
  sportKey?: string;
  minutes?: number;
  kcal?: number;
  distanceKm?: number;
};

const KEY = 'nabdh.workouts';

// A little seeded history so progression/PRs are visible on first run (dev only).
function seed(): WorkoutSession[] {
  if (!__DEV__) return [];
  const day = 86400000;
  const now = Date.now();
  const mk = (daysAgo: number, w: number): WorkoutSession => {
    const sets: SetEntry[] = [
      { weight: w - 10, reps: 10 },
      { weight: w, reps: 8 },
      { weight: w + 5, reps: 6 },
    ];
    return {
      id: `seed-${daysAgo}`,
      at: new Date(now - daysAgo * day).toISOString(),
      kind: 'gym',
      exKey: 'legpress',
      sets,
      volume: volume(sets),
      e1rm: bestE1rm(sets),
      readiness: 70,
    };
  };
  return [mk(14, 60), mk(10, 65), mk(6, 68), mk(2, 72)];
}

type WorkoutState = {
  sessions: WorkoutSession[];
  addSession: (s: Omit<WorkoutSession, 'id' | 'at'>) => void;
  clear: () => void;
  lastFor: (exKey: string) => WorkoutSession | undefined;
  bestE1rmFor: (exKey: string) => number;
  e1rmTrendFor: (exKey: string) => number[];
  isPrFor: (exKey: string, e1rm: number) => boolean;
};

const Ctx = createContext<WorkoutState | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>(seed());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const arr = JSON.parse(v) as WorkoutSession[];
        if (Array.isArray(arr)) setSessions(arr);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const persist = (next: WorkoutSession[]) => {
    setSessions(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next.slice(-200))).catch(() => {});
  };

  const addSession: WorkoutState['addSession'] = (s) => {
    const session: WorkoutSession = {
      ...s,
      id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      at: new Date().toISOString(),
    };
    persist([...sessions, session]);
  };

  const gymFor = (exKey: string) =>
    sessions.filter((s) => s.kind === 'gym' && s.exKey === exKey).sort((a, b) => a.at.localeCompare(b.at));

  const value: WorkoutState = {
    sessions,
    addSession,
    clear: () => persist([]),
    lastFor: (exKey) => gymFor(exKey).slice(-1)[0],
    bestE1rmFor: (exKey) => gymFor(exKey).reduce((best, s) => Math.max(best, s.e1rm ?? 0), 0),
    e1rmTrendFor: (exKey) => gymFor(exKey).map((s) => s.e1rm ?? 0),
    isPrFor: (exKey, e1rm) => e1rm > 0 && e1rm >= gymFor(exKey).reduce((best, s) => Math.max(best, s.e1rm ?? 0), 0),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkouts(): WorkoutState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWorkouts must be used within a WorkoutProvider');
  return ctx;
}
