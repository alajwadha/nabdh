import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHALLENGES, FRIENDS, type Challenge, type Friend } from '../data/social';

const KEY = 'nabdh.social.joined';

type SocialState = {
  friends: Friend[];
  challenges: (Challenge & { joined: boolean })[];
  joinedCount: number;
  toggleJoin: (id: string) => void;
};

const Ctx = createContext<SocialState | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  // Which challenges you've joined (persisted). Seed with the two in progress in dev.
  const [joined, setJoined] = useState<Set<string>>(() => new Set(__DEV__ ? ['c1', 'c2'] : []));

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (!v) return;
      try {
        const arr = JSON.parse(v) as string[];
        if (Array.isArray(arr)) setJoined(new Set(arr));
      } catch {
        /* ignore */
      }
    });
  }, []);

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };

  const challenges = useMemo(
    () => CHALLENGES.map((c) => ({ ...c, joined: joined.has(c.id) })),
    [joined],
  );

  return (
    <Ctx.Provider value={{ friends: FRIENDS, challenges, joinedCount: joined.size, toggleJoin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSocial(): SocialState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSocial must be used within a SocialProvider');
  return ctx;
}
