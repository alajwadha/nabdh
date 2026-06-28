import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nabdh.fasting';

type Persisted = { planKey: string; startedAt: number | null };

type FastingStore = {
  planKey: string;
  startedAt: number | null; // ms, null for Ramadan (clock-driven) or when idle
  setPlan: (key: string) => void;
  start: (key: string) => void;
  stop: () => void;
};

const Ctx = createContext<FastingStore | undefined>(undefined);

export function FastingProvider({ children }: { children: ReactNode }) {
  const [planKey, setPlanKey] = useState('16:8');
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const p = JSON.parse(v) as Persisted;
        if (p.planKey) setPlanKey(p.planKey);
        if (typeof p.startedAt === 'number') setStartedAt(p.startedAt);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const save = (next: Persisted) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const setPlan = (key: string) => {
    setPlanKey(key);
    save({ planKey: key, startedAt });
  };
  const start = (key: string) => {
    const at = key === 'ramadan' ? null : Date.now();
    setPlanKey(key);
    setStartedAt(at);
    save({ planKey: key, startedAt: at });
  };
  const stop = () => {
    // Reset off the clock-driven Ramadan plan so the screen returns to the picker
    // (otherwise active stays true forever and the stop button is a no-op).
    const nextKey = planKey === 'ramadan' ? '16:8' : planKey;
    setPlanKey(nextKey);
    setStartedAt(null);
    save({ planKey: nextKey, startedAt: null });
  };

  return <Ctx.Provider value={{ planKey, startedAt, setPlan, start, stop }}>{children}</Ctx.Provider>;
}

export function useFasting(): FastingStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFasting must be used within a FastingProvider');
  return ctx;
}
