import { createContext, useContext, useState, type ReactNode } from 'react';
import type { HealthDaily } from '@nabdh/shared';
import { DEMO_SUMMARY } from '../integrations/demo';

// In-memory health summary + connected source. Lets the dashboard show data from
// any device (Fitbit, Apple Health) without requiring Firebase to be configured.
// When Firebase is set up, summaries also persist to Firestore (healthDaily).
type Source = 'healthkit' | 'fitbit' | null;

type HealthState = {
  summary: HealthDaily | null;
  source: Source;
  /** True once a real device (Fitbit/Apple Health) has been linked. */
  connected: boolean;
  setSummary: (summary: HealthDaily) => void;
};

const HealthContext = createContext<HealthState | undefined>(undefined);

export function HealthProvider({ children }: { children: ReactNode }) {
  // In dev we seed the demo summary so the UI isn't empty; `connected` stays
  // false until a real device links, at which point setSummary takes over and
  // the demo seed is never reapplied.
  const [summary, setSummaryState] = useState<HealthDaily | null>(__DEV__ ? DEMO_SUMMARY : null);
  const [source, setSource] = useState<Source>(__DEV__ ? 'fitbit' : null);
  const [connected, setConnected] = useState(false);

  const setSummary = (next: HealthDaily) => {
    setSummaryState(next);
    setSource(next.source === 'fitbit' ? 'fitbit' : 'healthkit');
    setConnected(true);
  };

  return (
    <HealthContext.Provider value={{ summary, source, connected, setSummary }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthState {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within a HealthProvider');
  return ctx;
}
