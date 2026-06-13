# Nabdh (نبض)

Arabic-first, iOS-first AI health coach for the Saudi market. Connects wearables (Apple Watch via HealthKit, Fitbit Air via the Google Health API), unifies the data, adds food-photo nutrition with a curated Saudi/Gulf dish database, and gives predictive, closed-loop coaching through a swappable AI provider with a Saudi-context layer on top.

The full product plan (architecture, phases, compliance, risks, the ~96-dish catalog, and the step-by-step build plan) lives in [`docs/PLAN.md`](docs/PLAN.md).

## Monorepo layout

```
nabdh/
├─ app/                 Expo (React Native) iOS-first app
│  ├─ app/              expo-router routes (sign-in, onboarding, (tabs), …)
│  └─ src/
│     ├─ design-system/ dark theme tokens + UI primitives
│     ├─ i18n/          Arabic-first RTL localization
│     ├─ animations/    Reanimated helpers
│     └─ services/      firebase client, etc.
├─ backend/             In-region Node/Express (Cloud Run) - AI proxy, OAuth, Saudi-context layer
│  └─ src/saudi-context/ THE MOAT (system prompt + dish DB)
├─ packages/shared/     Shared TypeScript types
├─ docs/                Compliance + privacy docs
└─ firestore.rules      Firestore security rules
```

## Prerequisites

- Node 20+, npm, git.
- **macOS + Xcode** for local iOS builds (recommended) — see [`docs/run-on-mac.md`](docs/run-on-mac.md). On Windows/Linux you build in the cloud with EAS instead.
- An Apple Developer account (enroll as a **company / legal entity**, required for a health app). A free personal Apple ID is enough for local dev builds.
- A physical iPhone + paired Apple Watch (HealthKit needs a real device; the simulator cannot test it, but every screen runs on the simulator with sample data).

## First-time setup (run these)

```bash
cd nabdh

# 1. Install all workspace dependencies (add --legacy-peer-deps if npm reports peer conflicts)
npm install

# 2. Pin every Expo/native lib to the exact SDK-compatible version (IMPORTANT)
cd app
npx expo install --fix

# 3. Start the dev server (needs a dev build, not Expo Go — see below)
npx expo start --dev-client
```

### Build the iOS dev client

**On a Mac (recommended) — build locally with Xcode, no cloud needed:**

```bash
cd nabdh/app
npx expo run:ios            # Simulator (full UI, sample data)
npx expo run:ios --device   # your iPhone (real Apple Health data)
```

The full Mac walkthrough — signing, device setup, common hiccups — is in [`docs/run-on-mac.md`](docs/run-on-mac.md).

**On Windows/Linux — build in the cloud with EAS:**

```bash
cd nabdh/app
npm i -g eas-cli && eas login
eas build:configure
eas build --profile development --platform ios
```

Install the resulting build on your iPhone (EAS gives an install link / QR), then run `npx expo start --dev-client` and open it.

### Firebase (Phase 0 step 0.9)

1. Create a Firebase project in the **`me-central1` (Doha)** region.
2. Enable Authentication (Apple, Google, Phone) and Cloud Firestore (regional location `me-central1`).
3. Paste the web config values into `app/app.json` under `expo.extra.firebase` (the app reads them via `expo-constants`).
4. Deploy rules: `firebase deploy --only firestore:rules`.

### GitHub

The repo lives at [github.com/alajwadha/nabdh](https://github.com/alajwadha/nabdh):

```bash
git clone https://github.com/alajwadha/nabdh.git
cd nabdh
# ...make changes...
git pull            # get the latest
git push            # publish your commits
```

## Status

**Phase 0 (scaffold) done; Phase 1 (auth + consent + HealthKit + dashboard) written, not yet device-tested.**

- Phase 0: monorepo, Expo app skeleton, dark design system, Arabic RTL i18n, backend stub + Saudi-context seed, shared types, Firestore rules, CI.
- Phase 1: Firebase auth (Apple + Google wired, phone OTP stubbed), auth-gated routing, the three consent gates (PDPL / HealthKit / AI cross-border), onboarding with goals, a HealthKit read wrapper, and a real dashboard with the daily summary.

Run `npm install` + `npx expo install --fix`, then `npx expo run:ios` (Mac) or an EAS dev build to try it on your iPhone. See the plan's Appendix B for the full roadmap.
