# Nabdh — "Expressive" full app design

The chosen direction from the modern round: **Option 3 — Expressive** (Material 3 Expressive-
inspired). Warm cream canvas, one saturated green hero, pastel tonal tiles (peach / lavender /
mint / pink), a near-black coach pill with yellow accent, pill nav + green FAB, and heavy
Plus Jakarta Sans display type.

Mockups live in `mockups/redesign/expressive/` — each sheet shows **3 design options per screen**:

| Sheet | Screen | Options |
|---|---|---|
| `01-signin` | Sign-in / welcome | A type hero · B green field + bottom sheet · C bento feature preview |
| `02-home` | Home / Today | A cards (the picked layout, refined) · B typographic list · C ring + daily plan |
| `03-food` | Food logging | A photo result sheet · B camera capture · C day diary + kcal budget |
| `04-sleep` | Sleep | A stages bar (default) · B score hero + stage rows · C week trends |
| `05-coach` | Coach | A chat + inline plan · B plan as tasks · C daily brief + actions |
| `06-dark-mode` | Dark mode | Home, food result, sleep, coach chat, sign-in — all dark |

## Design tokens (light)

```
bg        #F7F1E8   card      #FFFBF4   border   #EDE5D3
ink       #1F1C17   muted     #80796C
green     #2E7D5B   (hero gradient → #256A4C)
peach     #F7E3C2   lavender  #DDD6F6   mint  #D8EFE2   pink  #F8DCE4
coach pill#211E1A   accent    #F2C94C (yellow)
nav bg    #EFE8DA   radius    tiles 26 · hero 30 · phone 44 · pills 999
type      Plus Jakarta Sans 500–800 (Arabic: IBM Plex Sans Arabic)
```

## Dark mode mapping

- Cream canvas → warm near-black `#16130E`; cards `#211D16` with `#2E2920` borders.
- Pastel tiles → deep tinted surfaces, the pastel hue moves into the label/delta text
  (peach `#2E2517`/`#F2D5A4`, lavender `#262238`/`#CDC3F2`, mint `#1C2A21`/`#A9DEC2`,
  pink `#2C2024`/`#EFC3D0`).
- Green hero + FAB stay green (deepened gradient `#2E7D5B → #1D4934`) — color identity survives.
- Coach pill stays near-black but gains a border; yellow accent unchanged.
- Nav active pill inverts: cream pill, dark text.

Re-render: `cd mockups && node redesign/expressive/render.js`

## Interactive prototype (test it with fake data)

`mockups/redesign/expressive/prototype/index.html` is a **self-contained, clickable prototype** —
all screens wired together with transitions, fake data baked in, no build and no server needed.

- **Open it anywhere:** double-click the file, or open it in any mobile/desktop browser.
  Works fully offline (Google Fonts degrade to system fonts).
- **On your phone:** AirDrop/send the file to yourself, or from the repo folder run
  `npx serve mockups/redesign/expressive/prototype` and open the LAN URL on your phone.
- **What's wired:** sign-in → staggered home entrance with readiness count-up · direction-aware
  tab transitions with a sliding nav pill · sleep stage/week bars that grow in · FAB → camera
  with scanning beam and live dish recognition → result sheet → logs the meal, animates the
  kcal budget, checks off the plan (synced between Today and Coach) · coach chat with typing
  indicator and canned replies · 🌙 toggle cross-fades the whole app into dark mode.
- `prototype/test.js` drives the full flow headlessly and saves `state-*.png`;
  `prototype/gif.js` records `walkthrough.gif`.
