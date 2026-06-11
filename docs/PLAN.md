# Nabdh (نبض) - Project Plan v1

> AI-first, Arabic-first health coach for the Saudi market. iOS first (Expo + EAS), wearable data unification, food-photo nutrition, predictive + closed-loop coaching, a defensible Saudi-context layer on top of swappable AI providers.
> Status: PLAN ONLY. No feature code until you approve. Decisions below reflect your clarifying-question answers plus a 14-agent verification pass (web-researched, June 2026).

---

## 0. Context - why this plan looks the way it does

You gave a near-complete brief; most of the stack was already decided. The job of this plan was to (a) close the few decisions that change the architecture and (b) verify the time-sensitive, make-or-break facts before committing them. The verification pass changed three things in the brief and confirmed the rest:

1. **The Fitbit path moved.** The legacy Fitbit Web API (dev.fitbit.com) is being turned down in **September 2026** and is replaced by the **Google Health API** (`health.googleapis.com/v4`), live since ~May 2026. Both still require a **server-side OAuth 2.0 token exchange** (client secret cannot live in the app). We build against the Google Health API now. Your "Google Health API" instinct in the brief was correct.
2. **PDPL forbids casual cross-border health-data export.** Health data is "sensitive data" under Saudi PDPL. Sending it to US AI providers (Anthropic / OpenAI / Google US) on **explicit consent alone is NOT compliant**. It needs a permitted purpose + appropriate safeguards (Saudi Standard Contractual Clauses, since the US is not on any SDAIA adequacy list) + a mandatory **Transfer Risk Assessment** + data minimization. This single fact drives the AI architecture: the **default managed model runs on Gemini via Vertex AI pinned to a Middle East region**, so raw health data is processed in-region and the hard cross-border path is the exception (BYO premium models), gated behind extra consent + on-device minimization.
3. **The backend host changes for the health-sensitive parts.** Vercel is US-hosted, so routing health data through Vercel functions is itself a cross-border transfer. The health-data + AI-proxy + Fitbit-OAuth services should run **in-region on Google Cloud** (Cloud Run, co-located with Firestore). Vercel can still host the static marketing site / privacy policy (no health data).

Confirmed as-is: HealthKit via Expo dev builds works and is well-supported; Firestore is GA in-region (Dammam `me-central2`, Doha `me-central1`); Samsung partner intake is paused (dev-mode only, cannot ship publicly); managed-model cost is even cheaper than estimated (~$0.05–0.30 per active user/month for Gemini Flash class).

### Decisions locked (from the clarifying pass)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | iOS build toolchain | **Expo dev builds + EAS Build** | You are on Windows with an iPhone + Apple Watch + Fitbit Air. EAS compiles iOS in the cloud (no Mac), you install dev builds on the real iPhone. HealthKit needs a physical device anyway. |
| 2 | AI model at launch | **Managed strong-mid default (Gemini 2.5 Flash via Vertex, in-region) + optional BYO key for premium (Claude / GPT / Gemini-direct)** | Zero onboarding friction, ~$0.05–0.30/user/mo (well under ~$1.85/user/mo net), and in-region default sidesteps the PDPL cross-border problem. BYO unlocks premium without cost to you. |
| 3 | Quality-perception safeguard | Default to a strong-mid model (not the cheapest); route once-a-day "showcase" insights to a stronger model; make the default model a **server-side flag**; eval against real coaching scenarios pre-launch; frame BYO as "Pro models" | Neutralizes the risk that users blame Nabdh for a cheap model. Coach quality is ~80% the Saudi-context layer + their real data, ~20% raw model IQ. |
| 4 | Design source | **Generate a code-level design system first** | No finished Figma yet. Define dark theme, single accent, type scale, spacing, motion specs before building screens. |
| 5 | Sign-in | **Apple + Google + Phone OTP** | Apple requires Sign in with Apple when offering social login; phone OTP is the KSA-familiar path. Firebase Auth supports all three. |

### Open items that still need YOUR action (not blockers to start, but blockers to public launch)

- **Register the Apple Developer account as a company / legal entity**, not an individual. Apple Guideline 5.1.1(ix): health is a "highly regulated field" and individual-developer health apps get rejected.
- **Decide the in-region path** (plain version: this is just which Gulf city's data center physically stores your users' data; both keep it out of the US): `me-central1` (Doha, Qatar) is self-serviceable on a normal Google Cloud project; `me-central2` (Dammam, inside Saudi Arabia) requires contracting through Google's exclusive KSA reseller **CNTXT**. **Recommended: start on Doha** (fast, self-serve, regional) for the MVP, then move to Dammam (in-Kingdom) for public launch at scale.
- **Engage Saudi-qualified privacy counsel** before public launch to finalize Saudi SCCs + DPAs with AI/cloud vendors, the Transfer Risk Assessment, and SDAIA registration scope.
- **Confirm the 99 SAR/year price** maps to an Apple SAR price point (prices are picked from Apple's fixed tiers, not free-form; the nearest tier may be 98.99 or 99.99).

---

## 1. Core product pillars (your 3 + 2 proposed)

Your brief listed 3 core concepts and asked me to "add 4-5 too." Proposed additions in **bold**:

1. **Predictive** - anticipate and warn ("sleep down 3 days, energy will dip tomorrow, go lighter today").
2. **Closed-loop** - food + sleep + activity feed one engine that auto-adjusts the daily plan.
3. **Saudi context layer** - dishes, Ramadan/fasting mode, extreme heat, prayer-time scheduling, applied on top of any model. The moat.
4. **Longitudinal coach memory** - a persistent personal model that remembers goals, patterns, and which advice actually moved your metrics, so coaching compounds over weeks instead of resetting each session.
5. **Privacy & sovereignty by design** - "your health data is processed in-Kingdom; you can see, export, or delete all of it." Turns the PDPL constraint into a marketing feature; in the Saudi market this is a genuine trust differentiator, not just fine print.
6. **Explainable coaching (proposed)** - every insight shows the data behind it and a plain "why," so advice feels transparent and trustworthy instead of a black box. This also reinforces the medical-disclaimer posture.
7. **Family & social accountability (proposed)** - optional shared goals, family challenges (e.g., a Ramadan family step challenge), and a caregiver view. Family is central in Saudi life, and shared accountability is a strong retention driver.
8. **Proactive, context-timed coaching (proposed)** - the coach reaches out at the right moments anchored to the daily rhythm (pre-suhoor hydration, post-Taraweeh activity, peak-heat warnings), instead of waiting to be opened.

---

## 2. Architecture overview + data flow

### 2.1 System description

```
┌──────────────────────────── DEVICE (iOS, Expo dev build) ────────────────────────────┐
│  Nabdh App (React Native, New Architecture, Arabic-RTL)                                │
│   • HealthKit (on-device, @kingstinct/react-native-healthkit) - steps, HR, sleep,     │
│     HRV, SpO2, energy. Never leaves device except as minimized summaries.             │
│   • Firebase Auth (Apple / Google / Phone OTP)                                        │
│   • expo-secure-store (Keychain) - session token + the user's OWN BYO key only        │
│   • On-device minimization for BYO path (strip identifiers, derive summaries)         │
│   • RevenueCat SDK (subscription)                                                     │
└───────────────┬───────────────────────────────────────────────┬──────────────────────┘
                │ HTTPS (App Attest-gated)                        │ BYO: direct device → provider
                ▼                                                 ▼  (key in Keychain, never on our server)
┌──────────── IN-REGION BACKEND (Google Cloud, me-central1/2) ──────────┐     ┌─────────────────────┐
│  Cloud Run (Node/Express) + Cloud Functions                            │     │ Anthropic / OpenAI / │
│   • AI Proxy → Vertex AI (Gemini 2.5 Flash) IN-REGION = managed default │     │ Google Gemini (US)   │
│   • Provider router + model config flag + prompt caching                │     │  = BYO "Pro" only,   │
│   • Saudi-context layer (system prompt + knowledge) ← THE MOAT          │     │  cross-border path   │
│   • Privacy: minimize/pseudonymize before ANY cross-border call         │     └─────────────────────┘
│   • Fitbit/Google Health API OAuth token exchange + refresh + sync      │
│   • Health normalizer (unify device metrics) + insight/closed-loop engine │
│   • USDA FoodData Central proxy; RevenueCat / App Store webhooks         │
│   • App Attest / Play Integrity verification; per-user rate + spend caps │
└───────────────┬───────────────────────────────────────────────────────┘
                ▼
┌──────────── DATA (Google Cloud, same region) ────────────┐    ┌──── External (no health data) ────┐
│  Cloud Firestore (regional, me-central2/me-central1)      │    │  Aladhan API (prayer times, Hijri) │
│   • users, healthDaily, meals, coachMemory, consents,     │    │  Google Health API (Fitbit cloud)  │
│     insights, subscriptions  + Firestore security rules   │    │  Vercel (static marketing site)    │
└───────────────────────────────────────────────────────────┘    └────────────────────────────────────┘
```

**The moat** is the Saudi-context layer + the curated Saudi/Gulf dish database + longitudinal memory + the closed-loop engine, all provider-agnostic. The AI model is swappable from a settings screen; the intelligence we own is the prompt/knowledge/data-formatting layer that wraps whatever model is selected.

### 2.2 Data flows

**A. Wearable sync (Apple Watch).** HealthKit observer query (`subscribeToChanges`) + anchored query fires on new samples → app reads steps/HR/sleep/HRV/SpO2/energy on-device → writes a **derived daily summary** (not raw streams) to Firestore in-region. Raw HealthKit data stays on device.

**B. Wearable sync (Fitbit Air).** App opens OAuth consent (Google Health API) → redirect back → app sends auth code to backend → **backend** exchanges code for tokens using the client secret, stores/refreshes tokens, pulls Fitbit cloud data, normalizes into the same daily-summary schema in Firestore.

**C. AI coach turn (default, managed).** App builds a coaching request → backend attaches the Saudi-context system prompt (cached) + the user's coach memory + a **minimized** health summary → calls **Gemini 2.5 Flash on Vertex AI in-region** → streams the reply back. No health data leaves the region.

**D. AI coach turn (BYO "Pro").** User has added their own Claude/GPT key. App performs **on-device minimization**, shows the cross-border consent gate (names the provider + data types), then calls the provider **directly from the device** with the user's key (key only in Keychain, never on our server). This is the only cross-border path and it is opt-in.

**E. Food photo.** Photo, barcode, or Arabic text/voice ("اكلت صحن كبسة"), to a minimized vision/NLP call (managed Gemini in-region by default), to structured JSON (items, calories, macros, confidence). Resolve values **local-first**: curated Nabdh Saudi/Gulf dish DB, then FatSecret (Gulf + Arabic + branded/restaurant), then Open Food Facts (barcode/packaged), then USDA (generic ingredients). User edits quantities/items, then it logs to Firestore. Always "estimate, not measurement," always manually correctable.

**F. Daily insight + closed-loop (showcase moment).** Once-a-day scheduled job reads the trailing window of daily summaries → runs the predictive/closed-loop engine → calls a **stronger model** (Gemini 2.5 Flash or Haiku-tier) with the Saudi context (incl. Ramadan/prayer/heat) → produces the adjusted daily plan + a plain-language "why." Cached, so it is cheap despite the better model.

### 2.3 Key architectural decisions

- **Provider abstraction at the backend**, on the lowest common denominator all three providers share: streaming chat, multimodal input, system prompt, prompt caching, structured output. Normalize each provider's token-usage fields into one schema so cost-per-conversation is comparable. The default model is a config value (providers rename models often: gpt-4o-mini → gpt-5-mini → gpt-5.4-mini within a year).
- **Our shared keys never ship in the app.** Even Keychain-stored keys are extractable; the managed model's credentials live only on the in-region backend, fronted by App Attest + rate/spend caps. The user's BYO key is theirs (different threat model) and may live in their Keychain.
- **In-region by default, minimize before crossing the border.** The compliant default never exports health data. The BYO path minimizes/pseudonymizes on-device and is consent-gated.
- **Unified health schema.** HealthKit and Fitbit/Google Health normalize into one daily-summary document so the dashboard, charts, and coach are device-agnostic. Samsung and Garmin slot into the same schema later behind a clean integration seam.

### 2.4 Nutrition data strategy (Saudi/Gulf local dishes)

USDA FoodData Central is US-centric and weak on local dishes, so it is only the generic-ingredient fallback. Local accuracy is a differentiator and part of the moat. The lookup is layered:

1. **Curated Nabdh Saudi/Gulf dish DB (the moat).** A hand-curated table of the top local dishes (Kabsa, Mandi, Saleeg, Jareesh, Margoog, Harees, Mutabbaq, Mansaf, Shawarma, Kunafa, Luqaimat, and more) with Arabic + English names, per-100g macros as the source of truth, and a house portion size to compute per-serving. Seeded from a peer-reviewed 2025 Saudi food-composition study (Frontiers in Nutrition, PMC12641437; ~25 dishes across 5 regions) plus Al-Kanhal lab data for wheat dishes. Lives in `backend/src/saudi-context/dishes.ts`.
2. **FatSecret Platform API (primary external).** The only provider with a localized Saudi/Gulf dataset, Arabic food names, barcode, natural-language parsing, and photo recognition in one. Free "Premier" startup tier to build; the Gulf market add-on is quote-based for production.
3. **Open Food Facts (packaged products, free).** ~15,500 Saudi-tagged products with Arabic fields and barcodes, no API key. First lookup on a barcode scan; FatSecret is the fallback.
4. **USDA FoodData Central (generic ingredients only).** Rice, chicken, oil, etc. for composing and cross-checking dishes.
5. **SFDA Saudi Food Composition Database (pursue).** The national authority launched it in 2024-25; it covers traditional dishes but has no public API yet. Action: contact SFDA to license/obtain it; if secured, it upgrades the curated DB.
6. **myfood24 Middle East Arabic FCDB (optional, Phase 2).** Research-grade Arabic Gulf-dish nutrition (~2,016 items, Saudi + Kuwait), licensable, no public API.

Seed values for the curated DB (per typical serving; per-100g stored as truth, portions are house assumptions and editable):

| Dish (EN / AR) | Serving | kcal | P / C / F (g) | Confidence |
|---|---|---|---|---|
| Kabsa, meat / كبسة لحم | ~350 g | ~480 | 26 / 55 / 18 | Med-high (Frontiers) |
| Kabsa, chicken / كبسة دجاج | ~350 g | ~380 | 18 / 51 / 12 | Med-high |
| Mandi / مندي | ~350 g | ~365 | 19 / 39 / 14 | Med-high |
| Saleeg / سليق | ~350 g | ~390 | 23 / 39 / 15 | Med-high |
| Jareesh / جريش | ~300 g | ~360 | 15 / 47 / 12 | Med-high |
| Margoog / مرقوق | ~300 g | ~270 | 12 / 33 / 11 | Med-high |
| Mutabbaq / مطبق | ~150 g | ~235 | 11 / 24 / 10 | Med-high |
| Mansaf / منسف | ~350 g | ~840 | 43 / 57 / 47 | High (per-100g) |
| Harees / هريس | ~275 g | ~210-250 | 15-20 / 35-45 / 6-8 | Low-med |
| Shawarma, chicken / شاورما | ~275 g | ~450-600 | ~30 / ~45 / 15-25 | Low (aggregator) |
| Kunafa / كنافة | ~120 g | ~320-420 | 6-10 / ~40 / 16 | Low (varies) |
| Luqaimat / لقيمات | ~80 g | ~280-370 | ~4 / ~36 / 13 | Low (varies) |

Harees, Kunafa, Luqaimat, and Shawarma lack peer-reviewed Saudi data and are flagged low-confidence (replace once SFDA data is obtained). The full sourced **~96-dish catalog** (7 categories, with per-dish confidence) is in **Appendix A** at the end of this document; it becomes `backend/src/saudi-context/dishes.ts`.

---

## 3. File / folder structure

Monorepo (single repo, two deployable targets + shared types).

```
nabdh/
├─ app/                              # Expo React Native app (iOS-first)
│  ├─ app.config.ts                  # Expo config: plugins (healthkit, secure-store, RTL)
│  ├─ eas.json                       # EAS profiles: development / preview / production
│  ├─ babel.config.js                # babel-preset-expo (wires Reanimated plugin; do NOT add worklets/plugin)
│  ├─ src/
│  │  ├─ app/                        # expo-router routes
│  │  │  ├─ (auth)/                  # sign-in, phone OTP, onboarding
│  │  │  ├─ (onboarding)/            # PDPL consent, HealthKit consent, AI-sharing consent
│  │  │  ├─ (tabs)/                  # dashboard, coach, nutrition, profile
│  │  │  └─ _layout.tsx
│  │  ├─ features/
│  │  │  ├─ dashboard/               # unified multi-device cards + charts + history
│  │  │  ├─ coach/                   # AI coach screen + chat + memory UI
│  │  │  ├─ nutrition/               # food photo, macro editor, water, weight
│  │  │  ├─ insights/               # predictive insights + closed-loop daily plan
│  │  │  ├─ devices/                 # connect/disconnect HealthKit, Fitbit, (Samsung seam)
│  │  │  ├─ consent/                 # reusable consent gates (PDPL, HealthKit, AI cross-border)
│  │  │  └─ paywall/                 # subscription paywall + trial
│  │  ├─ design-system/             # theme tokens, colors, typography, spacing, motion
│  │  ├─ animations/                # Reanimated helpers: count-up, stagger, shared transitions
│  │  ├─ components/                # shared UI primitives (Card, Chart, Button, Disclaimer)
│  │  ├─ i18n/                       # react-i18next config + ar.json / en.json
│  │  ├─ integrations/
│  │  │  ├─ healthkit/               # @kingstinct/react-native-healthkit wrappers + observers
│  │  │  ├─ fitbit/                  # OAuth launch + sync client (talks to backend)
│  │  │  ├─ samsung/                 # Phase 2 seam (dev-mode only)
│  │  │  └─ garmin/                  # deferred seam (interface only, no impl)
│  │  ├─ ai/
│  │  │  ├─ client.ts                # calls backend AI proxy (managed default)
│  │  │  ├─ byok/                    # BYO key storage (secure-store) + direct provider client
│  │  │  └─ minimize.ts              # on-device minimization for BYO path
│  │  ├─ services/                   # firebase, api client, purchases (RevenueCat), prayer, hijri
│  │  ├─ store/                      # state (zustand) + server cache (react-query)
│  │  ├─ utils/  └─ types/
│  └─ assets/
├─ backend/                          # Google Cloud, in-region (Cloud Run + Functions)
│  ├─ src/
│  │  ├─ index.ts                    # Express app
│  │  ├─ routes/
│  │  │  ├─ ai.ts                    # managed AI proxy → Vertex AI Gemini (in-region)
│  │  │  ├─ fitbit.ts                # Google Health API OAuth exchange + refresh + sync
│  │  │  ├─ nutrition.ts             # USDA FoodData Central proxy + cache
│  │  │  └─ webhooks.ts              # RevenueCat / App Store Server Notifications v2
│  │  ├─ saudi-context/              # THE MOAT
│  │  │  ├─ system-prompt.ts         # coaching persona + cacheable static context
│  │  │  ├─ dishes.ts                # Saudi dish nutrition knowledge
│  │  │  ├─ ramadan.ts  ├─ heat.ts  └─ prayer.ts
│  │  ├─ ai/
│  │  │  ├─ providers/               # vertex-gemini, gemini-direct, claude, openai
│  │  │  ├─ router.ts                # provider abstraction + model-config flag
│  │  │  └─ cache.ts                 # prompt-cache setup per provider
│  │  ├─ privacy/                    # minimize.ts, pseudonymize.ts, consent-enforce.ts
│  │  ├─ health/                     # normalize.ts (unify devices) + insights/closed-loop engine
│  │  └─ attest/                     # App Attest / Play Integrity verification
│  └─ package.json
├─ packages/shared/                  # shared TS types + constants (metrics, consent, model ids)
├─ docs/                             # privacy-policy.ar/en, ropa.md, transfer-risk-assessment.md,
│                                    # app-review-notes.md, demo-account.md
├─ firebase.json  firestore.rules  firestore.indexes.json
├─ .github/workflows/               # CI: lint, typecheck, eas build
└─ README.md
```

---

## 4. Phase-by-phase build plan

Each phase ends with concrete acceptance criteria. Phases 1–7 take the app to App Store submission; Phase 8 is post-launch expansion.

### Phase 0 - Foundations & scaffold
Scope: Repo + git, Expo SDK 55 app (RN 0.83, New Architecture), EAS dev build installs on your iPhone, Firebase project (region decided), design system + RTL i18n skeleton, CI.
- Stack: `react-native-reanimated@4` + `react-native-worklets`, `react-native-gesture-handler`, `victory-native` (Victory Native XL) + `@shopify/react-native-skia`, `expo-localization` + `react-i18next`, `expo-secure-store`, `expo-dev-client`.
- **Acceptance:** A dev build runs on the physical iPhone; app boots in Arabic RTL with an English toggle (toggle triggers `Updates.reloadAsync`); design-system tokens render a sample screen; `eas build --profile development` succeeds from Windows; repo is on GitHub with CI green.

### Phase 1 - Auth, onboarding, consent, HealthKit, dashboard skeleton
Scope: Firebase Auth (Apple + Google + Phone OTP); onboarding; the three consent gates (PDPL data processing, HealthKit, AI cross-border sharing); HealthKit read of steps/HR/sleep/HRV/SpO2/energy via `@kingstinct/react-native-healthkit`; daily-summary write to Firestore; a basic dashboard reading those summaries; medical disclaimer component.
- **Acceptance:** User signs in all three ways; "Connected to Apple Health" indicator shows; HealthKit values appear on the dashboard from real Watch data; declining any consent degrades gracefully (no crash, feature disabled); consents are versioned and stored; every health screen shows the medical disclaimer.

### Phase 2 - Fitbit (Google Health API) + unified data + charts/history
Scope: Backend OAuth token exchange/refresh against `health.googleapis.com/v4`; pull Fitbit Air data; normalize into the shared schema; interactive charts (Victory Native XL) with 30-day history + weekly comparison; device connect/disconnect UI.
- **Acceptance:** Fitbit connects via OAuth and its data lands in the same dashboard as HealthKit; charts hit 60fps and pan/scrub by gesture; disconnect revokes tokens; a user with both devices sees one unified view, no duplicates.

### Phase 3 - AI coach (provider abstraction + managed Gemini in-region + Saudi context + memory)
Scope: Backend AI proxy → Vertex AI Gemini in-region; Saudi-context system prompt with prompt caching; coach chat with streaming; longitudinal coach memory in Firestore; provider/model settings screen; the cross-border consent enforced for any BYO call; on-device minimization for BYO; App Attest gating.
- **Acceptance:** Coach answers in Arabic using the user's real metrics; the system prompt is cached (verify reduced input cost); memory persists across sessions and visibly personalizes replies; switching the managed model via the server flag changes behavior with no app update; a BYO key works end-to-end and never touches our server; AI calls are blocked without consent.

### Phase 4 - Food photo + Saudi dish DB + nutrition logging
Scope: Camera, barcode, or Arabic text/voice entry, to a vision/NLP call, to structured macros JSON with confidence. Resolve **local-first**: curated Saudi/Gulf dish DB, then FatSecret, then Open Food Facts (barcode), then USDA. Editable quantity/items; log calories/protein/carbs/fat, water, weight/BMI. Seed the curated dish DB (Kabsa, Mandi, Shawarma, etc.) from the Frontiers 2025 study.
- **Acceptance:** A photo of a local dish (e.g., Kabsa) returns editable items + calories + macros resolved against the Saudi dish DB; a barcode scan resolves via Open Food Facts; Arabic text entry ("صحن كبسة") logs correctly; manual correction always available; results labeled estimates with a disclaimer; a logged meal updates the daily summary and the coach can reference it.

### Phase 5 - Predictive insights + closed-loop + full Saudi context
Scope: Daily scheduled insight job (stronger model, cached); predictive warnings from trends; closed-loop daily-plan adjustment; Ramadan/fasting mode (Hijri detection via Aladhan + offline `moment-hijri`), prayer-time scheduling (Aladhan), extreme-heat guidance.
- **Acceptance:** A multi-day decline produces a correct predictive warning; the daily plan visibly adjusts to food/sleep/activity; Ramadan mode activates automatically in Hijri month 9 (with a manual day-offset override); prayer times localize to the user's location; each insight shows a plain-language "why."

### Phase 6 - Payments (RevenueCat) + paywall
Scope: RevenueCat (`react-native-purchases`); one subscription group → 1-year auto-renewable → free-trial intro offer; SAR price tier nearest 99; gate premium behind RevenueCat entitlements; Restore Purchases button; Small Business Program enrollment.
- **Acceptance:** Free trial → paid conversion works against a Sandbox tester; entitlement gates premium features; Restore Purchases works; the paywall states trial length, price, renewal, and cancellation clearly; Small Business Program submitted.

### Phase 7 - Compliance hardening + App Store submission prep
Scope: `PrivacyInfo.xcprivacy` privacy manifest; App Privacy nutrition labels (Health + Fitness + third-party sharing); in-app full account deletion; Arabic + English privacy policy; SDAIA National Data Governance Platform registration; Saudi SCCs + DPAs + Transfer Risk Assessment (with counsel); RoPA; 72-hour breach runbook; demo account + real screenshots + App Review notes; register the developer account as a legal entity.
- **Acceptance:** Account deletion removes the account record + all associated data; privacy labels match actual data flows and the manifest; the AI cross-border consent gate names providers + data types (satisfies Apple 5.1.2(i)); demo account + review notes prepared; the build passes an internal compliance checklist; TestFlight build accepted.

### Phase 8 - Post-launch expansion (do not block launch)
Samsung Health Data SDK behind the seam (dev-mode build/test now; ship only if/when partner intake reopens); Android release (RTL re-test on Android, Health Connect for Android-side wearables); English-locale polish; Garmin only if you incorporate and gain enterprise access.

---

## 5. External accounts & keys - setup checklist

| # | Account / key | Used for | Steps (high level) |
|---|---------------|----------|--------------------|
| 1 | **Apple Developer Program** ($99/yr) | iOS builds, HealthKit, IAP, submission | Enroll **as an Organization/legal entity** (D-U-N-S number; required for a health app under 5.1.1(ix)). Then create the App ID, enable the HealthKit capability, create the app in App Store Connect. |
| 2 | **Expo / EAS** | Cloud iOS builds from Windows | Create an Expo account; `npm i -g eas-cli`; `eas login`; configure `eas.json`. Free tier is fine to start. |
| 3 | **Google Cloud / Firebase project** | Auth, Firestore (in-region), Vertex AI, Cloud Run | Create the project; pick region: **`me-central1` Doha (self-serve)** for MVP, or **`me-central2` Dammam via CNTXT** for in-Kingdom residency; enable Firestore (regional), Firebase Auth (Apple/Google/Phone), Vertex AI API, Cloud Run. |
| 4 | **Google Health API** (Fitbit) | Pull Fitbit Air cloud data | In Google Cloud: configure the OAuth consent screen, request Google Health API access, create OAuth client (web/server type). Keep the **client secret server-side only**. Note the legacy Fitbit Web API sunsets Sept 2026; build against `health.googleapis.com/v4`. |
| 5 | **Vertex AI** | Managed default model (Gemini, in-region) | Enable Vertex AI in the same region; create a service account for the backend; confirm Gemini 2.5 Flash availability in the chosen region. |
| 6 | **Nutrition data (layered)** | Local dishes + packaged + generic | **FatSecret Platform API** (primary: localized Saudi/Gulf + Arabic + barcode + NLP; free startup tier, Gulf add-on quote-based) + **Open Food Facts** (free, no key: Saudi packaged products + barcode) + **USDA FoodData Central** (free key, generic ingredients only, never ship `DEMO_KEY`) + the curated Nabdh dish DB seeded from the Frontiers 2025 study. Optionally pursue the **SFDA** national food-composition DB. |
| 7 | **Aladhan API** | Prayer times + Hijri/Ramadan | No key required. Cache monthly responses on-device. |
| 8 | **RevenueCat** | Subscriptions | Create account + project; add the App Store app + shared secret; let RevenueCat auto-configure App Store Server Notifications v2. Free under $2,500 MTR. |
| 9 | **SDAIA National Data Governance Platform** | PDPL controller registration | Register as a data controller (sensitive-data processing triggers this); maintain RoPA; appoint a DPO. |
| 10 | **Saudi privacy counsel + vendor DPAs/SCCs** | Cross-border legality | Execute Saudi SCCs (Controller-to-Processor) + DPAs with any US AI/cloud vendor used; complete and retain a Transfer Risk Assessment. |
| 11 | **BYO provider keys** | "Pro" models | None for you. Users supply their own Anthropic/OpenAI/Google keys, stored in their device Keychain. |

---

## 6. Risks & mitigations

| Risk | Severity | Mitigation (built into the architecture) |
|------|----------|------------------------------------------|
| PDPL: exporting health data to US AI providers on consent alone is non-compliant | **High** | Default managed model on **Vertex AI Gemini in-region** (no export); BYO cross-border path is opt-in, minimized/pseudonymized on-device, consent-gated; Saudi SCCs + DPA + Transfer Risk Assessment; data minimization everywhere. |
| Firestore in-Kingdom (Dammam) is gated behind CNTXT reseller | Medium | MVP on **`me-central1` Doha (self-serve)**; migrate to `me-central2` Dammam via CNTXT for true in-Kingdom residency at scale. Document the residency posture. |
| Apple 5.1.2(i) third-party-AI consent (Nov 2025) rejection | **High** | Dedicated in-app consent gate naming the provider(s) + exact HealthKit data types + purpose, affirmative opt-in, separate from ToS. Zero-retention/no-training vendor tiers + DPA. |
| Users blame Nabdh for a "cheap" managed model | Medium | Strong-mid default; showcase insights use a stronger model; server-side model flag; pre-launch evals; BYO "Pro" escape valve; quality carried by the Saudi-context layer. |
| Fitbit Web API sunset (Sept 2026) | Medium | Build against the **Google Health API v4** from day one; server-side token exchange already required either way. |
| Samsung partner intake paused | Low | Seam only; build/test in dev-mode; do not gate launch on it. |
| HealthKit needs a physical device; no Mac | Low | You have iPhone + Apple Watch; EAS dev builds install over the air; simulator never needed. |
| Vercel (US) for health data = cross-border | Medium | Run health/AI/Fitbit-OAuth on **Google Cloud in-region**; Vercel hosts only the static marketing site. |
| AI cost / quota abuse | Low | Gemini Flash default + prompt caching; App Attest + per-user rate and spend caps on the proxy. |
| Food-photo accuracy (~30% energy error image-only) | Medium | "Estimate, not measurement" labeling; prompt for portion/ingredients (halves error); local-first cross-check (Saudi dish DB, FatSecret, Open Food Facts, USDA); always manually editable; disclaimer. |
| Local-dish data sparse / low-confidence (Harees, Kunafa, Luqaimat, Shawarma); FatSecret Gulf pricing is quote-based | Medium | Seed the curated DB from the peer-reviewed Frontiers 2025 study; flag low-confidence dishes; pursue the SFDA national DB; confirm the FatSecret Gulf add-on cost before committing; Open Food Facts covers packaged goods for free. |
| Individual developer account rejection for a health app | Medium | Register the Apple account as a legal entity (Phase 7, before submission). |
| Garmin enterprise-only | Low | Deferred seam (interface only); revisit if you incorporate. |
| BYO API key for non-technical users (adoption) | Resolved | Managed default removes the requirement; BYO is optional for power users. |

---

## 7. Immediate next steps (Phase 0, on approval)

1. Create the GitHub repo + monorepo scaffold (`app/`, `backend/`, `packages/shared/`, `docs/`).
2. Initialize the Expo SDK 55 app, add the animation/RTL/secure-store stack, produce a first EAS dev build for your iPhone.
3. Stand up the Firebase project in `me-central1` (Doha) and wire Auth + an empty Firestore with rules.
4. Lay down the design-system tokens (dark theme, accent, type scale, spacing, motion) and one sample screen in Arabic RTL.
5. In parallel (your action): start the Apple Organization enrollment (D-U-N-S can take time) and the USDA key signup.

> No feature code starts until you approve this plan. Tell me to proceed, or tell me what to change.

---

## Appendix A - Saudi/Gulf dish seed catalog (~96 dishes)

This is the seed for `backend/src/saudi-context/dishes.ts`, the local-first layer of the nutrition engine.

**Methodology & honesty note.** Values are per **typical serving** (portion sizes are deliberate house assumptions you can tune; where a per-100g figure exists it is the source of truth and servings are computed in-app). **Confidence:** High = anchored to the peer-reviewed 2025 Saudi food-composition study (Frontiers in Nutrition, PMC12641437) or to USDA reference foods. Med = consensus of nutrition aggregators (FatSecret, Nutritionix, MyNetDiary, snapcalorie). Low = no dish-specific data found, reasoned from close analogs, so verify before relying. Only ~12 dishes trace to the peer-reviewed study; most are aggregator-derived and recipe variance (oil, meat, sugar, portion) is large, so treat Med/Low rows as ranges. Upgrade with SFDA national data when obtained, and always let users correct a value.

### A.1 Rice & grain mains

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Kabsa, meat / كبسة لحم | 350 g | 480 | 25/54/17 | High |
| Kabsa, chicken / كبسة دجاج | 350 g | 380 | 19/51/12 | Med |
| Mandi, lamb / مندي لحم | 350 g | 365 | 19/39/14 | High |
| Mandi, chicken / مندي دجاج | 350 g | 430 | 22/50/14 | Med |
| Machboos / مجبوس | 350 g | 570 | 34/54/23 | Med |
| Saleeg / سليق | 350 g | 390 | 23/39/15 | High |
| Ruz Bukhari / رز بخاري | 350 g | 500 | 18/60/18 | Med |
| Mathloutha / مثلوثة | 300 g | 360 | 15/62/5 | Low |
| Maqluba / مقلوبة | 300 g | 480 | 24/54/18 | Med |
| Biryani, Gulf / برياني | 350 g | 600 | 30/70/22 | Med |
| Jareesh / جريش | 300 g | 360 | 15/47/12 | High |
| Margoog/Matazeez / مرقوق-مطازيز | 300 g | 270 | 12/33/11 | High |
| Qursan / قرصان | 300 g | 300 | 18/28/14 | Low |
| Harees / هريس | 250 g | 250 | 18/38/9 | Med |
| Aseedah / عصيدة | 200 g | 503 | 8/96/12 | Med |
| Murabyan (shrimp rice) / مربيان | 350 g | 610 | 40/75/17 | Med |

### A.2 Meat & poultry

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Madfoon / مدفون | 350 g | 480 | 26/56/17 | Med |
| Madhbi, grilled chicken / مذبي | 350 g | 620 | 42/50/28 | Med |
| Mashawi, mixed grill / مشاوي | 350 g | 700 | 55/12/48 | Low-Med |
| Lamb kofta / كفتة لحم | 150 g | 330 | 22/4/25 | Med |
| Shish tawook (grilled chicken) / شيش طاووق | 200 g (2 skewers) | 330 | 40/6/16 | High |
| Shish kebab (lamb) / شيش كباب | 150 g (2 skewers) | 330 | 28/5/23 | Med |
| Shawarma sandwich, chicken / شاورما دجاج | 250 g wrap | 480 | 30/48/18 | Med |
| Shawarma plate, chicken / شاورما صحن | 350 g | 620 | 40/60/25 | Med |
| Saloona, Gulf stew / صالونة | 250 g | 300 | 24/18/15 | Med |
| Maraq laham, meat stew / مرق لحم | 400 g | 330 | 24/20/15 | Med |
| Mumawwash (rice, mung beans, meat/fish) / مموش | 300 g | 400 | 19/60/9 | Low |
| Kibdah, liver / كبدة | 150 g | 290 | 32/6/15 | Med |
| Mughalgal, diced beef / مغلغل | 200 g | 340 | 32/6/21 | Low |
| Mansaf / منسف | 350 g | 840 | 43/57/46 | High |

### A.3 Bread, breakfast & dairy

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Tameez/Tamees bread / تميس | 1 pc (95 g) | 240 | 8/48/2 | Med |
| Khubz/Aish flatbread / خبز عيش | 1 loaf (100 g) | 270 | 10/55/1 | Med |
| Khubz Ruqaq, thin bread / خبز رقاق | 1 pc (30 g) | 95 | 3/20/0.5 | Low |
| Masoub / معصوب | 250 g | 451 | 9/88/10 | High |
| Balaleet / بلاليط | 200 g | 410 | 10/78/9 | Med |
| Areeka / عريكة | 150 g | 460 | 8/75/15 | High |
| Shakshuka / شكشوكة | 250 g (2 eggs) | 250 | 14/10/17 | Med |
| Ful medames / فول مدمس | 200 g | 190 | 13/30/2 | Med |
| Fatayer, spinach / فطائر سبانخ | 1 pc (70 g) | 125 | 4/22/3 | Med |
| Labneh / لبنة | 30 g (2 tbsp) | 50 | 3/2/4 | Med |
| White cheese, jibna / جبنة بيضاء | 1 slice (30 g) | 79 | 4/1/6 | Med |
| Gers ogaily, cake / قرص عقيلي | 1 slice (80 g) | 415 | 5/70/14 | Med |
| Dates + Arabic coffee / تمر وقهوة | 2 dates + cup | 135 | 1/35/0.5 | Med |
| Eggah, omelette / عجة | 150 g (2-3 eggs) | 230 | 16/3/17 | Med |

### A.4 Seafood

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Sayadiyah, fish & rice / صيادية | 300 g | 520 | 28/80/8 | High |
| Fish Machboos/Kabsa / مكبوس سمك | 350 g | 600 | 40/70/18 | Med |
| Grilled Hamour, grouper / هامور مشوي | 200 g fillet | 240 | 51/0/3 | High |
| Fried fish, zubaidi / سمك مقلي | 150 g | 250 | 20/10/15 | Med |
| Shrimp Machboos / مكبوس روبيان | 300 g | 560 | 38/70/16 | Med |
| Quwarmah / قورمة | 350 g | 620 | 35/65/22 | Low |
| Robyan, shrimp curry / مرق روبيان | 250 g (no rice) | 290 | 30/12/14 | Med |
| Grilled Safi, rabbitfish / صافي مشوي | 200 g | 280 | 38/0/13 | Low |
| Samak meshwi, grilled fish / سمك مشوي | 250 g | 410 | 45/12/18 | Med |

### A.5 Vegetable, legume & soup

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Shorbat adas, lentil soup / شوربة عدس | 250 g | 200 | 11/32/4 | Med |
| Maraq khudar, veg stew / مرق خضار | 250 g | 120 | 4/18/4 | Low |
| Mahshi / warak enab / محشي ورق عنب | 4 pcs (120 g) | 170 | 3/22/8 | Med |
| Bamia, okra stew / بامية | 200 g | 120 | 4/17/5 | Med |
| Molokhia / ملوخية | 220 g | 90 | 5/9/4 | Med |
| Fasolia, white bean stew / فاصوليا | 250 g | 280 | 13/40/9 | Med |
| Hummus / حمص | 30 g (2 tbsp) | 50 | 2/5/3 | High |
| Mutabbal / Baba ghanoush / متبل | 30 g (2 tbsp) | 45 | 1/3/4 | Med |
| Tabbouleh / تبولة | 180 g | 200 | 4/18/14 | Med |
| Fattoush / فتوش | 200 g | 230 | 5/25/13 | Med |
| Daqoos, tomato salsa / دقوس | 30 g (2 tbsp) | 25 | 1/3/1 | Low |
| Salata khadra, green salad / سلطة خضراء | 150 g | 80 | 2/7/5 | Low |
| Ruz abyad, white rice / رز أبيض | 158 g (1 cup) | 205 | 4/45/0.5 | High |
| Adas, lentils / عدس | 198 g (1 cup) | 226 | 18/40/1 | High |

### A.6 Street food & snacks

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Sambousek, meat / سمبوسك لحم | 1 pc (40 g) | 100 | 4/12/4 | Med |
| Sambousek, cheese / سمبوسك جبن | 1 pc (40 g) | 110 | 5/13/5 | Med |
| Falafel/Taameya / فلافل | 3 pcs (50 g) | 165 | 6/16/9 | Med |
| Kibbeh, fried / كبة مقلية | 1 pc (50 g) | 130 | 9/9/7 | Med |
| Mutabbaq, savory / مطبق | 1 pc (150 g) | 235 | 11/24/10 | Med |
| Manakish zaatar / مناقيش زعتر | 1 pc (120 g) | 300 | 8/40/12 | Med |
| Manakish cheese / مناقيش جبن | 1 pc (130 g) | 390 | 13/32/18 | Med |
| Arayes, meat / عرايس | 1 pc (110 g) | 340 | 18/17/21 | Med |
| Batata harra / بطاطا حارة | 150 g | 200 | 3/30/8 | Med |
| Regag/Ragag / رقاق | 1 pc (30 g) | 100 | 4/21/0.3 | Med |
| Maakouk/Markouk, saj bread / مرقوق صاج | 1 loaf (50 g) | 177 | 7/37/1.3 | Low |

### A.7 Sweets, desserts & drinks

| Dish (EN / AR) | Serving | kcal | P/C/F (g) | Conf |
|---|---|---|---|---|
| Kunafa / كنافة | 1 pc (120 g) | 320 | 6/40/16 | Med |
| Luqaimat / لقيمات | 4 pcs (80 g) | 280 | 4/36/13 | Med |
| Basbousa / بسبوسة | 1 pc (60 g) | 280 | 5/44/11 | Med |
| Maamoul, date / معمول تمر | 1 pc (30 g) | 110 | 2/18/4 | Med |
| Maamoul, date, large / معمول تمر كبير | 1 pc (45 g) | 170 | 3/27/7 | Med |
| Qatayef / قطايف | 2 pcs (90 g) | 290 | 4/50/9 | Low |
| Umm Ali / أم علي | 240 g | 430 | 9/57/19 | Med |
| Saudi Halawa, halva / حلاوة طحينية | 50 g | 270 | 5/27/16 | Med |
| Muhalabia / مهلبية | 150 g | 190 | 5/33/5 | Med |
| Sago pudding / ساقو | 150 g | 200 | 2/45/4 | Low |
| Baklava / بقلاوة | 1 pc (50 g) | 215 | 4/27/11 | Med |
| Debyaza / دبيازة | 120 g | 250 | 3/50/6 | Low |
| Arabic coffee, Gahwa / قهوة عربية | 60 ml, unsweetened | 2 | 0/0/0 | High |
| Karak chai / كرك | 200 ml, sweetened | 150 | 3/20/5 | Med |
| Sobia / سوبيا | 240 ml | 200 | 5/31/8 | Low |
| Jallab / جلاب | 240 ml | 150 | 0/37/0 | Med |
| Qamar al-din / قمر الدين | 240 ml | 210 | 4/39/6 | Med |
| Laban, buttermilk / لبن | 245 g | 110 | 8/12/3 | Med |

**Coverage:** 96 dishes (16 rice/grain, 14 meat/poultry, 14 bread/breakfast/dairy, 9 seafood, 14 veg/legume/soup, 11 street food, 18 sweets/drinks). Room to grow toward 100+ as users log dishes the catalog misses (a "missing dish" capture flow feeds the curated DB over time).

---

## Appendix B - Detailed build steps (phase by phase)

The proposed pillars 6 (explainable), 7 (family/social), and 8 (proactive timed) are folded in where they fit (marked). Each phase lists ordered steps and ends with a milestone you can check.

### Phase 0 - Foundations & scaffold
0.1 Install toolchain: Node LTS, Git, `npm i -g eas-cli`; create Expo + EAS accounts; `eas login`.
0.2 Scaffold monorepo `nabdh/` with `app/`, `backend/`, `packages/shared/`, `docs/`; `git init`; create the GitHub repo; first commit.
0.3 Create the Expo app (SDK 55, TypeScript, expo-router) in `app/`; New Architecture is on by default.
0.4 Install core libs: `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler @shopify/react-native-skia victory-native expo-localization react-i18next i18next expo-secure-store expo-dev-client`.
0.5 Configure Babel (rely on babel-preset-expo, do NOT add the worklets plugin); wrap the app root in `GestureHandlerRootView`.
0.6 Build the design system in `design-system/`: dark palette + one accent, type scale, spacing, radii, shadows, motion tokens; primitives Screen / Card / Text / Button.
0.7 i18n + RTL: wire expo-localization + react-i18next; `ar.json` / `en.json`; on language change call `I18nManager.forceRTL` then `Updates.reloadAsync`; author with logical style props (marginStart/paddingEnd).
0.8 Animation baseline: count-up hook, staggered list entrance, shared screen-transition helper.
0.9 Firebase: create the project in `me-central1` (Doha); enable Auth + Firestore (regional); add config; deny-all-then-per-user `firestore.rules`.
0.10 EAS: write `eas.json` (development / preview / production); run `eas build --profile development --platform ios`; install the dev build on your iPhone.
0.11 CI: GitHub Actions for lint + typecheck.
**Milestone:** dev build runs on the iPhone; app boots in Arabic RTL with an English toggle (reload flips layout); a sample screen uses design tokens + one animation; EAS build is green; repo on GitHub with CI passing.

### Phase 1 - Auth, onboarding, consent, HealthKit, dashboard skeleton
1.1 Firebase Auth providers: Apple, Google, Phone OTP; sign-in screens; auth state + protected routes.
1.2 User profile doc in Firestore (goals, locale, units); onboarding flow (goals, basics).
1.3 Reusable consent gates, versioned and stored in `consents`: PDPL data-processing, HealthKit, and AI cross-border sharing (names providers + data types).
1.4 Install HealthKit: `@kingstinct/react-native-healthkit` + `react-native-nitro-modules`; add the config plugin with usage strings + `background:true`; rebuild the dev client.
1.5 Request read auth for stepCount, distanceWalkingRunning, heartRate, restingHeartRate, heartRateVariabilitySDNN, oxygenSaturation, activeEnergyBurned, basalEnergyBurned, sleepAnalysis.
1.6 Read metrics and write a minimized `healthDaily/{date}` summary to Firestore (raw stays on device).
1.7 "Connected to Apple Health" indicator; graceful empty/denied states (you cannot detect a denied read).
1.8 Dashboard skeleton: cards from healthDaily (steps, HR, sleep, energy); medical-disclaimer component on every health screen.
**Milestone:** sign in all three ways; real Apple Watch data shows on the dashboard; declining a consent degrades gracefully; consents versioned/stored; disclaimer present.

### Phase 2 - Fitbit (Google Health API) + unified data + charts
2.1 Backend scaffold: Express on Cloud Run in `me-central1`; deploy a hello-world; service account + Secret Manager.
2.2 Google Cloud: enable the Google Health API; configure the OAuth consent screen; create the OAuth client (web/server); store the client secret server-side only.
2.3 OAuth flow: app opens consent (expo-auth-session) to redirect to backend code-for-token exchange (PKCE + client secret) to encrypted token storage keyed to the user, with refresh.
2.4 Sync: backend pulls Fitbit cloud data (steps, HR, sleep, SpO2) and normalizes into the shared daily-summary schema in Firestore.
2.5 Unify HealthKit + Fitbit into one dashboard view; source priority to dedupe overlapping days.
2.6 Charts: Victory Native XL line/area, 30-day history + weekly comparison, gesture scrub/pan at 60fps.
2.7 Devices screen: connect/disconnect; disconnect revokes tokens.
**Milestone:** Fitbit connects via OAuth; its data lands in the same dashboard; charts hit 60fps with gestures; disconnect revokes; both devices show one unified view with no duplicates.

### Phase 3 - AI coach (provider abstraction + managed Gemini in-region + memory)
3.1 Backend AI router: provider abstraction (chat, vision, system prompt, caching, structured output); normalize usage/token fields into one schema.
3.2 Vertex AI in-region: integrate Gemini 2.5 Flash as the managed default; model id is a server-side config flag.
3.3 Saudi-context layer: system prompt (persona + cacheable static knowledge); enable prompt caching on the static prefix.
3.4 Coach memory: Firestore `coachMemory` (goals, patterns, past advice); inject into each request; update after sessions.
3.5 Minimization: build the minimized health-summary payload (no identifiers) sent to the model.
3.6 Coach chat UI: streaming, Arabic, history; an "explain / why" affordance on advice (pillar 6).
3.7 BYO path: store the user's key in secure-store; on-device minimization; direct provider call; enforce the cross-border consent; settings screen to pick provider/model.
3.8 Security: App Attest gating on the proxy; per-user rate + spend caps.
**Milestone:** coach answers in Arabic using real metrics; the system prompt is cached (lower input cost); memory persists and personalizes; flipping the server model flag changes behavior with no app update; a BYO key works and never touches our server; AI is blocked without consent.

### Phase 4 - Food photo + Saudi dish DB + nutrition logging
4.1 Seed `dishes.ts` from Appendix A (~96 dishes; per-100g where available + house portions + confidence flags).
4.2 Nutrition resolver, local-first: dish DB to FatSecret to Open Food Facts to USDA; register FatSecret + USDA keys server-side (Open Food Facts needs none).
4.3 Camera + vision: photo to minimized vision call to structured JSON (items, calories, macros, confidence).
4.4 Barcode scan: expo-camera to Open Food Facts lookup with FatSecret fallback.
4.5 Arabic text/voice entry ("صحن كبسة") through the resolver.
4.6 Macro editor: editable quantities/items; "estimate" disclaimer + confidence; always manually correctable.
4.7 Logging: write meals to Firestore; update the daily summary (calories consumed, macros, water, weight/BMI).
4.8 "Missing dish" capture flow that feeds the curated DB.
**Milestone:** a Kabsa photo resolves against the dish DB; a barcode resolves via Open Food Facts; Arabic entry logs; manual edit always available; estimates labeled; a logged meal updates the daily summary and the coach can reference it.

### Phase 5 - Predictive insights + closed-loop + Saudi context + proactive coaching
5.1 Insight engine: a daily scheduled job (Cloud Scheduler) reads the trailing window and computes trends (sleep, HRV, training load).
5.2 Predictive warnings: rules + model for "your energy will dip" style alerts, each with an explainable "why" (pillar 6).
5.3 Closed-loop: generate a daily plan that adjusts to food/sleep/activity; the once-a-day showcase insight uses a stronger model (cached).
5.4 Ramadan mode: Hijri detection (Aladhan `/gToH` + offline `moment-hijri`); in month 9, switch to fasting UI with suhoor/iftar timers and a manual day-offset override.
5.5 Prayer times: Aladhan by lat/long, cached monthly; prayer-anchored scheduling.
5.6 Heat: outdoor-activity guidance from local heat/weather.
5.7 Proactive coaching (pillar 8): timed notifications (pre-suhoor hydration, post-Taraweeh, peak-heat), with generic content only (no PHI in notifications).
**Milestone:** a multi-day decline produces a correct warning; the plan visibly adjusts; Ramadan auto-activates in month 9 with override; prayer times localize; every insight shows its "why"; proactive nudges fire at the right moments.

### Phase 6 - Payments (RevenueCat) + paywall
6.1 App Store Connect: create the app; subscription group to a 1-year auto-renewable; set the SAR tier nearest 99; attach a free-trial intro offer; enroll in the Small Business Program.
6.2 RevenueCat: create the project; add the app + shared secret; auto-configure App Store Server Notifications v2.
6.3 Install `react-native-purchases` (+ `-ui`); rebuild the dev client; configure entitlements.
6.4 Paywall UI: state trial length, price, renewal, cancellation; include a Restore Purchases button.
6.5 Gate premium features off RevenueCat entitlements; optional backend webhook.
**Milestone:** trial-to-paid works against a Sandbox tester; entitlement gates premium; restore works; the paywall is clear; SBP submitted.

### Phase 7 - Compliance hardening + App Store submission prep
7.1 Ship `PrivacyInfo.xcprivacy` + App Privacy nutrition labels (Health + Fitness + third-party sharing).
7.2 In-app full account deletion (deletes the account + all associated data, not just deactivation).
7.3 Privacy policy (AR + EN) in-app and in App Store Connect; data-subject-rights workflows (access, copy, correct, delete, withdraw consent).
7.4 PDPL controller baseline: SDAIA National Data Governance Platform registration; RoPA; appoint a DPO; 72-hour breach runbook.
7.5 Cross-border: execute Saudi SCCs + DPAs with vendors; complete the Transfer Risk Assessment (with counsel); set vendor zero-retention / no-training.
7.6 Register the Apple account as a legal entity (company).
7.7 Review prep: demo account, real screenshots, App Review notes (HealthKit usage + AI data flow + consent UX).
7.8 Audit: medical disclaimers on every health screen; no sensor-only medical claims; no PHI in iCloud or notifications.
**Milestone:** account deletion removes all data; labels + manifest match the real flows; the AI consent gate names providers + data types (Apple 5.1.2(i)); demo + notes ready; TestFlight build accepted.

### Phase 8 - Post-launch expansion (does not block launch)
8.1 Samsung Health Data SDK behind the seam (build/test in dev-mode); ship only if partner intake reopens.
8.2 Family & social accountability (pillar 7): shared goals, family/Ramadan challenges, caregiver view (separate consent).
8.3 Android: re-test RTL, add Health Connect for Android-side wearables, Play Store compliance.
8.4 English-locale polish; Garmin only if you incorporate and gain enterprise access.
**Milestone:** at least one Phase 8 track shipped (most likely Android or family challenges) without regressing the iOS app.
