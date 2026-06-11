import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import type { HealthDaily } from '@nabdh/shared';
import { getDb } from './firebase';

function dailyRef(uid: string, date: string) {
  return doc(getDb(), 'users', uid, 'healthDaily', date);
}

/** Writes a minimized daily summary. Raw HealthKit samples never leave the device. */
export async function writeHealthDaily(uid: string, summary: HealthDaily): Promise<void> {
  await setDoc(dailyRef(uid, summary.date), summary, { merge: true });
}

export async function getHealthDaily(uid: string, date: string): Promise<HealthDaily | null> {
  const snap = await getDoc(dailyRef(uid, date));
  return snap.exists() ? (snap.data() as HealthDaily) : null;
}

export function subscribeHealthDaily(
  uid: string,
  date: string,
  callback: (summary: HealthDaily | null) => void,
): () => void {
  return onSnapshot(dailyRef(uid, date), (snap) => {
    callback(snap.exists() ? (snap.data() as HealthDaily) : null);
  });
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
