import { createContext, useContext, useState, type ReactNode } from 'react';
import type { HealthDaily } from '@nabdh/shared';

// In-memory health summary + connected source. Lets the dashboard show data from
// any device (Fitbit, Apple Health) without requiring Firebase to be configured.
// When Firebase is set up, summaries also persist to Firestore (healthDaily).
type Source = 'healthkit' | 'fitbit' | null;

type HealthState = {
  summary: HealthDaily | null;
  source: Source;
  setSummary: (summary: HealthDaily) => void;
};

const HealthContext = createContext<HealthState | undefined>(undefined);

export function HealthProvider({ children }: { children: ReactNode }) {
  const [summary, setSummaryState] = useState<HealthDaily | null>(null);
  const [source, setSource] = useState<Source>(null);

  const setSummary = (next: HealthDaily) => {
    setSummaryState(next);
    setSource(next.source === 'fitbit' ? 'fitbit' : 'healthkit');
  };

  return (
    <HealthContext.Provider value={{ summary, source, setSummary }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthState {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within a HealthProvider');
  return ctx;
}
