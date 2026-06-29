import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey, type Period } from '../data/cycle';

const KEY = 'nabdh.cycle';

// dev seed so the ring/predictions read live before the user logs anything
function seed(): Period[] {
  if (!__DEV__) return [];
  const today = new Date();
  const mk = (daysAgo: number, len: number): Period => {
    const s = new Date(today.getTime() - daysAgo * 86400000);
    const e = new Date(s.getTime() + (len - 1) * 86400000);
    return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
  };
  return [mk(58, 5), mk(30, 4), mk(2, 5)]; // ~28-day cycles, currently early in a new cycle
}

type CycleState = {
  periods: Period[];
  logPeriodStart: (date?: string) => void;
  setPeriodEnd: (start: string, end: string) => void;
  removePeriod: (start: string) => void;
  replacePeriods: (periods: Period[]) => void;
};

const Ctx = createContext<CycleState | undefined>(undefined);
const SEED = seed();

export function CycleProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<Period[]>(SEED);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const arr = JSON.parse(v) as Period[];
        if (Array.isArray(arr)) setPeriods(arr);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const save = (next: Period[]) => {
    const sorted = [...next].sort((a, b) => a.start.localeCompare(b.start)).slice(-36);
    setPeriods(sorted);
    AsyncStorage.setItem(KEY, JSON.stringify(sorted)).catch(() => {});
  };

  const logPeriodStart = (date = dayKey()) => {
    if (periods.some((p) => p.start === date)) return;
    save([...periods, { start: date }]);
  };
  const setPeriodEnd = (start: string, end: string) => save(periods.map((p) => (p.start === start ? { ...p, end } : p)));
  const removePeriod = (start: string) => save(periods.filter((p) => p.start !== start));

  return <Ctx.Provider value={{ periods, logPeriodStart, setPeriodEnd, removePeriod, replacePeriods: save }}>{children}</Ctx.Provider>;
}

export function useCycle(): CycleState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCycle must be used within a CycleProvider');
  return ctx;
}
