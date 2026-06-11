# Nabdh (نبض) — project context

Arabic-first, iOS-first AI health coach for the Saudi market. Expo (React Native) app +
Node/Express backend (Cloud Run, me-central1) + Firebase. Monorepo: `app/`, `backend/`,
`packages/shared/`, `mockups/`, `docs/`.

## Current state (June 2026)

- **Phase 0–1 code written** (auth, consent gates, HealthKit wrapper, basic dashboard) but
  not device-tested. See README.md and docs/PLAN.md.
- **UX/UI redesign completed and merged to main.** 23 design directions were explored
  (`mockups/redesign/`, `mockups/redesign/modern/`, docs in `docs/redesign-options.md` and
  `docs/redesign-modern-options.md`). The chosen direction is **"Expressive"** (Material 3
  Expressive-inspired): cream canvas `#F7F1E8`, green hero `#2E7D5B`, pastel tonal tiles
  (peach/lavender/mint/pink), near-black coach pill with yellow `#F2C94C` accent, pill nav +
  green FAB, Plus Jakarta Sans (Arabic: IBM Plex Sans Arabic). All tokens (light + dark) are
  documented in **`docs/redesign-expressive.md`**.
- **Interactive prototype v2** lives at `mockups/redesign/expressive/prototype/index.html` —
  a single self-contained HTML file, all fake data baked in, open in any browser. It is the
  living spec for the app: screens, transitions, and interactions should be ported from it.
  - Sign-in → Today / Sleep / Food / Coach tabs (direction-aware slide transitions, sliding
    nav pill), readiness count-up, FAB → camera → dish recognition → log-meal flow that
    updates the kcal budget and the synced plan checklist, coach chat with typing indicator,
    light/dark theme toggle.
  - v2 additions from a market study (Oura/Whoop/Apple Health/MyFitnessPal): tappable metric
    tiles → detail sheets with 7/30-day charts vs 28-day baseline, readiness contributors
    breakdown, sleep debt + bedtime consistency, water tracking, logging streak.
  - Sleep screen uses "option B" (score hero + stage rows) per user decision.
  - `prototype/test.js` = headless Puppeteer flow test (saves `state-*.png`);
    `prototype/gif.js` = walkthrough GIF recorder; `prototype/artifact.html` = auto-scaling
    build. Mockup sheets re-render via `render.js` in each mockups folder
    (`cd mockups && npm i puppeteer --no-save` first).

## Next step (agreed with Ali)

Port the Expressive design into the real Expo app:
1. Update `app/src/design-system/index.ts` tokens to the Expressive palette (light + dark
   from `docs/redesign-expressive.md`).
2. Rebuild screens to match the prototype (Today first, then Sleep B, Food flow, Coach),
   using Reanimated for the transitions (springs ~ `cubic-bezier(.22,1,.36,1)`, stagger
   entrances, count-ups).
3. Put all data behind a **`DEMO_MODE` flag with the prototype's fake data story** so the
   app is fully testable in the simulator/dev build before HealthKit is wired:
   readiness 64 (HRV down 3 nights), RHR 58 (+4), HRV 48 (−6), sleep 7:18 (+22m, score 82),
   steps 8,432/10k, kcal 1,412/1,900, kabsa lunch 642 kcal/38g protein, plan: walk after Asr,
   dinner <500 kcal, lights out 11:15.
4. Arabic-first: every screen needs an RTL Arabic counterpart (i18n files in `app/src/i18n/`).

## Conventions

- Design tokens change in one place only: `app/src/design-system/index.ts`.
- Keep the dark theme as a tonal mapping of the same palette (see the doc), never a
  separate design.
- Health data is sensitive: consent gates (PDPL / HealthKit / AI cross-border) must stay
  in front of any data collection. Firestore region me-central1.
- Git: feature branches + PRs to `main`. Past redesign work used branch
  `claude/ux-ui-redesign-options-v5nb3t` (now merged; prefer fresh branches).
