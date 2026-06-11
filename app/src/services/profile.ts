import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GoalType, UserProfile } from '@nabdh/shared';
import { getDb } from './firebase';

function profileRef(uid: string) {
  return doc(getDb(), 'users', uid);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Create the profile on first sign-in if it does not exist yet. */
export async function ensureUserProfile(uid: string, locale: 'ar' | 'en'): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;
  const profile: UserProfile = {
    uid,
    locale,
    units: 'metric',
    goals: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(profileRef(uid), profile, { merge: true });
  return profile;
}

export async function saveGoals(uid: string, goals: GoalType[]): Promise<void> {
  await setDoc(
    profileRef(uid),
    { goals, onboardedAt: new Date().toISOString() },
    { merge: true },
  );
}
