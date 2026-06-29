import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MindfulSession = { at: string; minutes: number; pattern: string };
const KEY = 'nabdh.mindful';
function dayKey(d = new Date()): string {
  // Local calendar day (not UTC) so streaks line up with the user's own clock.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type MindfulState = {
  sessions: MindfulSession[];
  totalMinutes: number;
  streak: number;
  addSession: (minutes: number, pattern: string) => void;
  replaceSessions: (sessions: MindfulSession[]) => void;
};

const Ctx = createContext<MindfulState | undefined>(undefined);

export function MindfulProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<MindfulSession[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const arr = JSON.parse(v) as MindfulSession[];
        if (Array.isArray(arr)) setSessions(arr);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const addSession = (minutes: number, pattern: string) => {
    setSessions((prev) => {
      const next = [...prev, { at: new Date().toISOString(), minutes, pattern }].slice(-500);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  // consecutive days (ending today or yesterday) with at least one session
  const days = new Set(sessions.map((s) => dayKey(new Date(s.at))));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const replaceSessions = (next: MindfulSession[]) => {
    const capped = next.slice(-500);
    setSessions(capped);
    AsyncStorage.setItem(KEY, JSON.stringify(capped)).catch(() => {});
  };

  return <Ctx.Provider value={{ sessions, totalMinutes, streak, addSession, replaceSessions }}>{children}</Ctx.Provider>;
}

export function useMindful(): MindfulState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMindful must be used within a MindfulProvider');
  return ctx;
}
