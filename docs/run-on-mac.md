# Run Nabdh on a Mac (local iOS build)

On macOS you build the iOS app locally with Xcode — no EAS cloud build needed.
Two paths: the **Simulator** (see the whole UI in ~5 min, demo data) and a
**physical iPhone** (real Apple Health data).

> The app uses native modules (HealthKit, Reanimated, Skia, Nitro), so it can't
> run in Expo Go — `expo run:ios` builds a proper dev client for you.

## 0. One-time tools

```bash
xcode-select --install                 # Command Line Tools
# Install Xcode from the App Store, then open it once to accept the license.
sudo xcodebuild -license accept
brew install cocoapods watchman        # if you don't have them
node -v                                # need Node 20+
```

## 1. Get the code

```bash
git clone https://github.com/alajwadha/nabdh.git
cd nabdh
git checkout claude/dreamy-brahmagupta-cv59as
```

## 2. Install dependencies

```bash
npm install            # installs all workspaces (app, backend, shared)
cd app
npx expo install --fix # pins every native lib to the exact SDK 55 version (important)
```

## 3a. See the full UI in the iOS Simulator (fastest)

```bash
# from nabdh/app
npx expo run:ios
```

This prebuilds the native project, runs `pod install`, compiles with Xcode, and
launches the Simulator. First build takes a few minutes; later runs are fast.

- In `__DEV__` the dashboard shows **sample data**, so every screen works:
  Today (swipe the green hero, tap *Customize*, add/remove tiles), Sleep, Food
  (add water, see the budget), Coach (type a message), Trends → Wrapped, Profile
  (flip the 🌙/☀️ theme, ☪ Ramadan mode, model picker, connect sheets).
- HealthKit is **not** available in the Simulator — that's expected; use a real
  iPhone for live health data (step 3b).

To open the Metro menu later without rebuilding: `npx expo start --dev-client`.

## 3b. Real Apple Health data on your iPhone

1. Plug in your iPhone (or be on the same Wi-Fi) and trust the Mac.
2. Open the native workspace once to set signing:
   ```bash
   open ios/nabdh.xcworkspace
   ```
   In Xcode → target **nabdh** → *Signing & Capabilities* → pick your **Team**
   (a free personal Apple ID works for development; the **paid Apple Developer
   Program** is needed for TestFlight/HealthKit reliability and is required
   before launch — enroll as a **company**, per the plan).
3. Build to the device:
   ```bash
   npx expo run:ios --device      # pick your iPhone from the list
   ```
4. On the iPhone: Settings → General → VPN & Device Management → trust your dev
   cert. Launch Nabdh, tap **Connect Apple Health** on Today (or Profile →
   Apple Health) and allow the data types. Steps/HR/HRV/sleep now flow in.

## 4. (Optional) Real Fitbit Air data via the backend

Fitbit Air comes through the **Google Health API**, and the OAuth token exchange
must run on the backend (the client secret can't ship in the app).

```bash
# Terminal 1 — run the in-region backend locally
cd nabdh/backend
npm install
cp .env.example .env        # fill GOOGLE_HEALTH_CLIENT_ID / _SECRET
npm run dev                 # listens on :8080
```

Then in `app/app.json` set:
- `expo.extra.backendUrl` → your machine's LAN URL, e.g. `http://192.168.1.x:8080`
  (not `localhost`, so the phone can reach it)
- `expo.extra.googleHealth.clientId` → your Google OAuth client ID

Rebuild the app. Profile → *Fitbit Air* now runs the real OAuth flow.

> Google Health API `/v4` resource paths + scopes are best-effort in
> `backend/src/google-health/index.ts` and `app/src/integrations/googleHealth` —
> confirm them against the live docs during this step.

## Firebase / sign-in

`app/app.json` already has a Firebase web config, so the app boots. In dev,
onboarding is skipped so you land straight on the dashboard. Apple/Google
sign-in needs the usual provider setup before it works end-to-end, but you don't
need it to explore the UI.

## Common hiccups

- **Pods fail / weird native error after pulling:** `cd app && npx expo prebuild --clean && npx expo run:ios`.
- **Metro cache weirdness:** `npx expo start -c`.
- **"Untrusted Developer" on device:** trust the cert in Settings (step 3b.4).
- **Build is slow the first time:** normal — Skia + new architecture compile a lot once, then cache.
