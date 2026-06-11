# Testing Nabdh on Android (free, on your Windows laptop)

No Apple Developer fee needed. This runs the app on a free Android emulator. Apple Watch / HealthKit is iOS-only and will show no data here; everything else works, and your Fitbit Air will show real data once Phase 2 (Fitbit) is built.

## Part 1 - Android Studio + emulator (one time, your laptop)
1. Install Android Studio: https://developer.android.com/studio (accept the default SDK during setup).
2. Open it, then the three-dot menu / "More Actions" -> Device Manager -> Create Device.
3. Pick "Pixel 8", a recent system image (e.g. Android 15), Finish.
4. Press the play button to launch the emulator. You now have an Android phone on your laptop.

## Part 2 - Expo account (free)
1. Create an account at https://expo.dev
2. In a terminal: `eas login` and sign in.

## Part 3 - Firebase (free; enables sign-in + data)
1. https://console.firebase.google.com -> Add project -> name it Nabdh.
2. Build -> Firestore Database -> Create -> location **me-central1 (Doha)** -> production mode.
3. Build -> Authentication -> Get started -> enable **Google** (and Email for a quick test).
4. Project settings (gear) -> General -> "Your apps" -> add a **Web app** (the </> icon) -> copy the config.
5. Paste those 6 values into `app/app.json` under `expo.extra.firebase`:
   `apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId`.
6. Google sign-in on Android: Project settings -> add an **Android app** (package `com.nabdh.app`).
   Then in https://console.cloud.google.com (same project) -> APIs & Services -> Credentials,
   copy the **Web client ID** into `expo.extra.google.webClientId` and the **Android client ID**
   into `expo.extra.google.androidClientId`.

## Build + run
```powershell
cd C:\Users\Ali-h\nabdh
npm install --legacy-peer-deps
cd app
npx expo install --fix

# Option A (reliable): cloud build -> gives an .apk to drag onto the emulator
eas build --profile development --platform android

# Option B (fully local): builds straight onto the running emulator
npx expo run:android
```
Then start the dev server and open it:
```powershell
npx expo start --dev-client
```
Press `a` to launch on the emulator. Sign in with Google -> onboarding -> dashboard.

## What to expect on Android
- Works: UI, Arabic RTL, Google sign-in, onboarding, consent gates, the dashboard shell, animations.
- Empty for now: the health cards (no Apple Watch / HealthKit on Android). Real data comes with Phase 2 (Fitbit).
- Not on Android: Apple Sign-In (the button is hidden automatically) and Apple Watch / HealthKit.
