import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleMedReminders } from '../services/notifications';

// Self-logged vitals + medications, the trackers competitor apps have that Nabdh lacked.
// All local + persisted; charts read these arrays directly.

export type WeightEntry = { at: string; kg: number };
export type BpEntry = { at: string; sys: number; dia: number };
export type GlucoseEntry = { at: string; mgdl: number };
export type Med = { id: string; name: string; dose?: string; schedule: string; takenDates: string[]; reminderOn?: boolean; reminderTime?: string };

const KEY = 'nabdh.healthlogs';
// NOTE: UTC day key. Fine for the Gulf (UTC+3 never rolls early); a future pass should
// switch to a local-timezone day so streaks don't tick a day early west of UTC.
export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function seed() {
  const day = 86400000;
  const now = Date.now();
  const mk = (n: number, base: number, drift: number, jitter: number) =>
    Array.from({ length: n }, (_, i) => ({ at: new Date(now - (n - 1 - i) * day * 2).toISOString(), v: +(base + drift * i + (i % 2 ? jitter : -jitter)).toFixed(1) }));
  const w = mk(14, 84, -0.45, 0.4).map((e) => ({ at: e.at, kg: e.v }));
  const bp = mk(8, 124, -0.6, 2).map((e, i) => ({ at: e.at, sys: Math.round(e.v), dia: 80 - i }));
  const g = mk(8, 102, -0.4, 4).map((e) => ({ at: e.at, mgdl: Math.round(e.v) }));
  const today = dayKey();
  const meds: Med[] = [
    { id: 'm-vitd', name: 'Vitamin D', dose: '1000 IU', schedule: 'Daily · morning', takenDates: [dayKey(new Date(now - day)), dayKey(new Date(now - 2 * day)), today] },
    { id: 'm-omega', name: 'Omega-3', dose: '1 g', schedule: 'Daily · with food', takenDates: [dayKey(new Date(now - day))] },
  ];
  return { weight: w, bp, glucose: g, meds };
}

type Logs = { weight: WeightEntry[]; bp: BpEntry[]; glucose: GlucoseEntry[]; meds: Med[] };

type HealthLogsState = Logs & {
  logWeight: (kg: number) => void;
  logBp: (sys: number, dia: number) => void;
  logGlucose: (mgdl: number) => void;
  addMed: (name: string, dose?: string, schedule?: string) => void;
  removeMed: (id: string) => void;
  toggleMedToday: (id: string) => void;
  setMedReminder: (id: string, patch: { reminderOn?: boolean; reminderTime?: string }) => void;
  medStreak: (m: Med) => number;
  replaceLogs: (partial: Partial<Logs>) => void;
};

const Ctx = createContext<HealthLogsState | undefined>(undefined);
// Demo data only in dev so the charts read live; production starts empty (and the user's
// first log can't "freeze in" seeded vitals).
const SEED: Logs = __DEV__ ? seed() : { weight: [], bp: [], glucose: [], meds: [] };

export function HealthLogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<Logs>(SEED);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as Partial<Logs>;
        setLogs((l) => ({ ...l, ...parsed }));
      } catch {
        /* ignore */
      }
    });
  }, []);

  const save = (next: Logs) => {
    setLogs(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const logWeight = (kg: number) => save({ ...logs, weight: [...logs.weight, { at: new Date().toISOString(), kg }].slice(-365) });
  const logBp = (sys: number, dia: number) => save({ ...logs, bp: [...logs.bp, { at: new Date().toISOString(), sys, dia }].slice(-365) });
  const logGlucose = (mgdl: number) => save({ ...logs, glucose: [...logs.glucose, { at: new Date().toISOString(), mgdl }].slice(-365) });

  const addMed = (name: string, dose?: string, schedule = 'Daily') =>
    save({ ...logs, meds: [...logs.meds, { id: `${Date.now()}`, name, dose, schedule, takenDates: [] }] });
  const removeMed = (id: string) => save({ ...logs, meds: logs.meds.filter((m) => m.id !== id) });
  const toggleMedToday = (id: string) => {
    const today = dayKey();
    save({
      ...logs,
      meds: logs.meds.map((m) =>
        m.id === id ? { ...m, takenDates: m.takenDates.includes(today) ? m.takenDates.filter((d) => d !== today) : [...m.takenDates, today] } : m,
      ),
    });
  };
  const setMedReminder = (id: string, patch: { reminderOn?: boolean; reminderTime?: string }) =>
    save({ ...logs, meds: logs.meds.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  // Reconcile per-med local notifications whenever the med set changes (no-op without the
  // native module or permission). Skip the first render so we don't fire on mount.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scheduleMedReminders(logs.meds);
  }, [logs.meds]);

  // consecutive days (ending today or yesterday) the med was taken
  const medStreak = (m: Med) => {
    const set = new Set(m.takenDates);
    let streak = 0;
    const d = new Date();
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1); // allow "not yet today"
    while (set.has(dayKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  // Replace only the provided slices (used by data import); untouched slices stay as-is.
  const replaceLogs = (partial: Partial<Logs>) => save({ ...logs, ...partial });

  return (
    <Ctx.Provider value={{ ...logs, logWeight, logBp, logGlucose, addMed, removeMed, toggleMedToday, setMedReminder, medStreak, replaceLogs }}>
      {children}
    </Ctx.Provider>
  );
}

export function useHealthLogs(): HealthLogsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHealthLogs must be used within a HealthLogsProvider');
  return ctx;
}
