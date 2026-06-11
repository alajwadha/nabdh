import { useEffect } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  type ApplicationVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase';

function generateNonce(byteLength = 32): string {
  const bytes = Crypto.getRandomBytes(byteLength);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Sign in with Apple -> Firebase. iOS only. */
export async function signInWithApple() {
  const rawNonce = generateNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error('Apple sign-in returned no identity token');
  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({
    idToken: credential.identityToken,
    rawNonce,
  });
  return signInWithCredential(getFirebaseAuth(), firebaseCredential);
}

/**
 * Google sign-in hook (expo-auth-session). Needs expo.extra.google.iosClientId
 * and webClientId set in app.json. Call promptGoogle() from a button.
 */
export function useGoogleSignIn() {
  const cfg = (Constants.expoConfig?.extra?.google ?? {}) as {
    iosClientId?: string;
    androidClientId?: string;
    webClientId?: string;
  };
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: cfg.iosClientId,
    androidClientId: cfg.androidClientId,
    webClientId: cfg.webClientId,
  } as any);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token ?? response.authentication?.idToken;
    if (!idToken) return;
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(getFirebaseAuth(), credential).catch(() => {
      /* surfaced by onAuthStateChanged / caller UI */
    });
  }, [response]);

  return { promptGoogle: () => promptAsync(), googleReady: !!request };
}

/**
 * Phone OTP. NOTE: Firebase JS SDK phone auth on React Native needs an
 * ApplicationVerifier (reCAPTCHA). Wire one on-device (e.g. a reCAPTCHA modal),
 * or switch this provider to @react-native-firebase/auth (native, no reCAPTCHA)
 * during on-device testing. Typed stub so the build is not blocked.
 */
export async function startPhoneSignIn(
  phoneNumber: string,
  verifier: ApplicationVerifier,
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(getFirebaseAuth(), phoneNumber, verifier);
}

/** Email/password sign-in and sign-up (Firebase). */
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}
