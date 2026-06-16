import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import type { UserProfile } from '@nabdh/shared';
import { getFirebaseAuth } from '../services/firebase';
import { ensureUserProfile, getUserProfile } from '../services/profile';
import i18n from '../i18n';

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** True when Firebase config is missing (app boots, sign-in disabled). */
  configError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  const timeout = setTimeout(() => setLoading(false), 5000);
  return () => clearTimeout(timeout);
}, []);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      setConfigError(true);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      const locale = i18n.language === 'en' ? 'en' : 'ar';
      setProfile(
        nextUser ? await ensureUserProfile(nextUser.uid, locale).catch(() => null) : null,
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthState = {
    user,
    profile,
    loading,
    configError,
    signOut: async () => {
      if (!configError) await firebaseSignOut(getFirebaseAuth());
    },
    refreshProfile: async () => {
      if (user) setProfile(await getUserProfile(user.uid).catch(() => null));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
