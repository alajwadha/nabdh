import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore getReactNativePersistence is provided by firebase/auth at runtime on RN
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase web config is injected via app.json -> expo.extra.firebase
// (filled from the Firebase console in Phase 0 step 0.9). Kept lazy so that
// importing this module never crashes before the project is configured.
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function getConfig(): FirebaseConfig {
  const cfg = Constants.expoConfig?.extra?.firebase as Partial<FirebaseConfig> | undefined;
  if (!cfg?.projectId) {
    throw new Error(
      'Firebase is not configured yet. Fill expo.extra.firebase in app.json (Phase 0 step 0.9).',
    );
  }
  return cfg as FirebaseConfig;
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(getConfig());
}

let cachedAuth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  try {
    cachedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Already initialized (e.g. Fast Refresh) - fall back to the existing instance.
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
