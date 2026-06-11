# Nabdh modern redesign — 10 options, 10+ sources

Round 3 of the design exploration (after `mockups/1-*…10-*` and `mockups/redesign/option-{a,b,c}`).
Brief: keep it modern, ground every option in a named, current (2025–26) design reference.

Mockups live in `mockups/redesign/modern/` (HTML + rendered PNG). Re-render:

```bash
cd mockups && npm i puppeteer --no-save && node redesign/modern/render.js
```

All ten screens tell the same data story (readiness 64, recovery day, HRV down 3 nights,
kabsa lunch, dinner ≤ 500 kcal) so the designs compare fairly.

## Inspiration sources

1. **Apple iOS 26 "Liquid Glass"** — translucent, refractive layered material; floating bubble
   toolbars. (apple.com/newsroom, June 2025)
2. **Apple visionOS** — frosted light glass panels with depth over soft color.
3. **Google Material 3 Expressive** (May 2025) — bigger type, 35-shape library, vivid tonal tiles,
   springy components.
4. **Gentler Streak** — 2025 Apple Design Award winner (Social Impact); encouraging, pastel,
   pressure-free health UX.
5. **The Outsiders** (same studio, ADA finalist) — the training-readiness dial: load vs recovery
   zones.
6. **Spotify Wrapped** — full-bleed color blocks, giant stat-story typography.
7. **Linear** — dark product-grade precision UI: 1px borders, dense rows, command bar.
8. **Duolingo** — path/streak/XP mechanics for habit formation.
9. **Apple Intelligence / Siri glow** — edge-glow gradients, AI-orb, "zero UI" ambient screens.
10. **Apple keynote bento grids / bento.me** — mixed-size tile compositions.
11. **Whoop / Oura** — recovery-score framing, baselines and deviation deltas (informs 4, 6, 8).
12. **Muzli "Mobile UI patterns 2026"** — bottom-sheet dominance, thumb-zone actions,
    glanceability; informed the bottom-anchored navs/CTAs across all options.

## The 10 options

| # | File | Direction | Inspired by |
|---|------|-----------|-------------|
| 1 | `m01-liquid-glass` | Translucent glass cards over a vivid mesh gradient, floating pill tab bar | iOS 26 Liquid Glass |
| 2 | `m02-spatial-light` | Light frosted panels over soft pastel blobs, airy and clinical-calm | visionOS |
| 3 | `m03-expressive` | Warm cream, giant friendly type, blob shapes, tonal pastel tiles, FAB | Material 3 Expressive |
| 4 | `m04-bento` | Dark bento grid, mixed tile sizes, gradient numerals, chart tile | Apple bento grids |
| 5 | `m05-gentle` | Pastel, encouraging, "comfy zone" wave path, zero pressure language | Gentler Streak |
| 6 | `m06-readiness-dial` | Recover/maintain/push zone dial + load-vs-recovery bars, lime on slate | The Outsiders |
| 7 | `m07-wrapped` | Full-bleed color blocks, 150px stat-story type, daily share-card energy | Spotify Wrapped |
| 8 | `m08-precision` | Product-grade dark: signals list, coach plan as checkable tasks, ⌘K bar | Linear |
| 9 | `m09-journey` | Daily "recovery quest" path with nodes, streak and XP | Duolingo |
| 10 | `m10-ai-ambient` | Near-black, edge glow, AI orb, one sentence + four numbers, ask bar | Apple Intelligence |

## Notes

- 1, 2, 4, 6, 8, 10 are "serious premium"; 3, 5, 9 are "warm friendly"; 7 is the wildcard
  (works brilliantly as a *daily share card* even if not the home screen).
- 8's "coach plan as tasks" and 6's load/recovery bars are strong candidates to merge into any
  winning visual direction.
- The render pipeline needs `--ignore-certificate-errors` inside the sandboxed container or Google
  Fonts silently fails and falls back to system fonts.
