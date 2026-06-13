# Nabdh — Prototype v3 (Expressive)

Single-file interactive prototype: `index.html` (open in any browser; capture states with
`node capture.js` from the repo root — needs `puppeteer` available in `mockups/`).

This builds on prototype v2 (`../prototype/index.html`) and adds the features the leading
health apps ship that v2 was missing, driven by a competitor study (June 2026).

## Competitor study — what the leaders do, and what we took

| Area | Who does it | What we built |
|------|-------------|---------------|
| **Customizable home** | Apple Health (editable *Favourites*), Oura ("More" expander), Peak / Hidgets / Bevel (pick-your-metrics dashboards) | Today's metric grid is fully user-editable — **add / remove / drag-reorder** tiles from an 11-metric catalog; choice persists in `localStorage` |
| **Swipeable insights** | Whoop *Daily Outlook* + *Day in Review*; Oura *Health Radar*; swipe-up pillar trends | The green hero is a **swipeable carousel** of 5 insight cards: Readiness · Predictive warning · Today's focus · Heat/Saudi context · Weekly-trend nudge |
| **Trends + weekly recap** | Whoop weekly/monthly/6-month *Trend Views*; Oura trends | **Trends** screen (week/month/6-month sparklines) + a **"Nabdh Wrapped"** swipeable weekly story |
| **Body-battery energy** | Garmin *Body Battery*; Oura daytime stress; Rise energy curve | Intraday **energy curve** on Today + Stress/SpO₂/Resp/VO₂/Resilience as optional metrics |
| **Tags / journal** | Oura tags; Whoop *Journal* (behaviour → impact) | **Journal** sheet: tag behaviours (late karak, nap, gym…) with an "what we've learned about you" impact insight — the *explainable coaching* pillar |
| **Saudi moat** | Muslim Pro / Tawakkalna (prayer + fasting), Hydro Coach | **Prayer-time strip**, prayer-anchored plan items, **Ramadan mode** (fasting countdown, iftar/suhoor, hydration window), peak-heat planning card |
| **Settings / sovereignty** | every wearable app | **Profile**: goals, wearable integrations, **AI model picker** (managed Gemini in-Kingdom vs BYO Pro), **PDPL in-Kingdom data** message, export/delete |
| **Social / gamification** | Strava/Nike/Fitbit streaks & challenges; family is central in KSA | **Family Ramadan step challenge** leaderboard, invite, streaks & **achievement badges** |

### Sources
- Whoop 2026 (Recovery, AI Coach, Daily Outlook, Trend Views): https://www.whoop.com/us/en/thelocker/2026-whats-new/ · https://support.whoop.com/hc/en-us/articles/360023075794-Viewing-Weekly-Trends
- Oura app redesign, readiness, resilience, tags, Health Radar: https://ouraring.com/blog/new-software-features/ · https://www.digitaltrends.com/phones/i-used-the-brand-new-oura-ring-app-here-is-why-you-will-want-it/
- Apple Health Summary / Favourites / Trends: https://www.howtogeek.com/669637/how-to-customize-the-summary-tab-in-the-iphones-health-app/
- Customizable dashboards (Peak, Hidgets, Bevel): https://feedback.bevel.health/feature-requests/p/configurable-home-screen
- Garmin Body Battery + morning report: https://clearcals.com/blogs/garmin-body-battery/
- Rise energy schedule / sleep debt / circadian: https://www.risescience.com/blog/rise-app-vs-sleep-cycle
- Cal AI / MyFitnessPal photo logging: https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens/
- Ramadan health apps (prayer/fasting/hydration): https://scoopempire.com/5-apps-that-help-you-stay-on-track-this-ramadan/
- Gamification / streaks / social accountability: https://trophy.so/blog/health-gamification-examples

## What's interactive
- Swipe the hero (scroll-snap + dots); tap a card to open the related detail / Trends.
- **Customize** → drag tiles to reorder, tap × to remove, "Add metric" sheet to add (persisted).
- Tap any metric tile → detail sheet with 7/30-day line or bar chart, baseline, contributors, coach insight.
- ☪ header button → **Ramadan mode** (banner, fasting countdown, prayer strip shifts to Maghrib).
- **＋ FAB** → quick menu: snap a plate (camera flow) · add water · journal a behaviour · ask coach.
- Avatar → **Profile** (model picker, sovereignty, family challenge, badges).
- Trends → **See your weekly recap** → tap-through "Wrapped" story.
- Food camera → AI dish result → log it (updates budget, macros, plan).
- 🌙 theme toggle → full dark mode.

## Capture
`node capture.js` writes `state-01 … state-21` PNGs (sign-in → today → customize → detail →
ramadan → quick-menu → journal → profile → trends → wrapped → sleep/food/coach → dark).
