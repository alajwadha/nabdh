# Nabdh UX/UI redesign — three directions

The first mockup round (`mockups/1-pulse.html` … `10-bold.html`) explored ten *visual* variations of
the same concept: a dark dashboard with a mint accent. This round starts over and explores three
**completely different products** — each changes the information architecture, not just the skin.

Mockups live in `mockups/redesign/` (HTML + rendered PNG). Re-render with:

```bash
cd mockups && npm i puppeteer --no-save && node redesign/render.js
```

---

## Option A — Sahifa (الصحيفة) · The Daily Brief

**Idea:** narrative-first. There is no dashboard. Every morning the coach *writes* your health to
you as a short editorial — a headline ("Go easy today, Ali"), a few sentences with the numbers woven
in, and three chapters (Sleep / Movement / Food). The week ends with a "Friday Review" cover.

- **IA:** Morning Brief → chapters → Friday Review. Food logging reads like a journal with the
  coach's margin notes.
- **Visual:** warm paper (`#F6F1E7`), ink text, oasis green + terracotta accents, Fraunces serif
  display, Amiri for Arabic. Print/magazine feel — hairline rules, small caps, drop numerals.
- **Why it fits Nabdh:** the AI coach is the product; prose is what an LLM does best. Calm and
  literary reads premium, and Arabic typography (Amiri/Naskh) shines in an editorial layout —
  the Arabic-first version would look *better* than the English one.
- **Risk:** glanceability — power users must tap once to reach raw numbers.

## Option B — Majlis (المجلس) · The Conversation

**Idea:** conversation-first. The entire app is one live chat with the coach. Meal photos drop into
the stream and come back as nutrition cards; vitals ride in a ticker at the top; a long-press opens
a big-numerals "Glance" sheet; evenings end with a voice check-in (pulsing orb).

- **IA:** one stream. No tabs, no dashboard, nothing to learn. Glance sheet + voice check-in are
  the only secondary surfaces.
- **Visual:** deep aubergine (`#120D1A`), coral + lavender + mint accents, Rubik / IBM Plex Sans
  Arabic, glassy bubbles, glowing orb. Warm, human, alive.
- **Why it fits Nabdh:** Saudi is a WhatsApp-native market — chat is the zero-training-cost UI, and
  it makes the *coach relationship* (the moat) the literal product. Closed-loop coaching maps
  naturally to proactive messages.
- **Risk:** history gets long; needs strong proactive-message quality or the stream feels spammy.

## Option C — Mizan (ميزان) · The Instrument

**Idea:** instrument-first, for the quantified-self power user. One dense, zero-scroll panel where
every number, its 28-day baseline, and its deviation are visible at once. Sleep gets a hypnogram;
food is an "intake ledger" table.

- **IA:** four hard tabs — Panel / Sleep / Fuel / Coach. Everything on one screen per tab,
  no scrolling on the panel.
- **Visual:** stark paper-white (`#F4F4EF`), pure-black hairline grid, IBM Plex Mono numerals,
  Archivo caps, zero border-radius inside the device, a single signal orange (`#FF4400`) reserved
  exclusively for deviations that need attention.
- **Why it fits Nabdh:** wearable-first users (Apple Watch + Fitbit) often *are* data people;
  baselines and deltas showcase the predictive engine. Stark light design is unowned territory —
  every competitor (Whoop, Oura, Athlytic) is dark-and-glowy.
- **Risk:** intimidating for casual users; Arabic numerals/mono pairing needs care in RTL.

---

## How to choose

| | A · Sahifa | B · Majlis | C · Mizan |
|---|---|---|---|
| Hero | the coach's *writing* | the coach *relationship* | the *data* |
| Audience | calm premium, mass | broadest, chat-native | power users |
| Mood | warm print, light | vivid dark, alive | stark light, technical |
| Differentiation | no health app looks like this | UX moat = conversation | anti-Whoop positioning |

The three are intentionally combinable: e.g. B's stream as home with A's Friday Review as the
weekly artifact and C's panel as the power-user "Glance" expansion.
