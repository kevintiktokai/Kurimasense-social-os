# Design Rules

The visual system is law by construction (see `brand/tokens.json`,
`CLAUDE.md`). This file is the human-readable summary of what "on-brand" means
and what the QA gate enforces.

## Non-negotiables (QA-enforced — `engine/qa.ts`)
- **Only token colours and fonts.** No hardcoded hex, no non-token font. Maize
  `#E6CF55` display type, cream frame, ink grounds. (`brand-color`, `brand-font`)
- **No frame clipping.** All text inside the canvas. (`clip`)
- **No heading–line overlap.** Highlighted headlines keep open leading.
  (`overlap`, `highlight-lead`)
- **Contrast:** ≥4.5:1 body, ≥3:1 display, measured against the real rendered
  background pixels. (`contrast`)
- **Minimum 18px text.** (`min-size`)
- **Reel safe zone:** all reel content in the centre 1080×1350. (`reel-safe`)
- **Logo present:** the KURIMASENSE mark on the frame. (`logo`)

A slide failing any rule is hard-blocked before it can reach review. The
deliberately-broken fixture (`engine/qa-fixture.ts`) must fail all of them.

## Composition (derived from `reference/`)
- Full-bleed graded photography under a tonality-matched dark scrim.
- Hairline rules top (y=100) and bottom (y=h−100).
- Frame: brand top-left, handle top-right, slide № bottom-right.
  **No web address on slides** (owner instruction).
- 96px side margins. Film grain overlay (seeded, deterministic).

## Type hierarchy (owner note, 2026-07)
- **Headline dominates.** Display serif is decisively larger than any
  supporting line — the reference look is one big statement + one quiet line.
- Kickers / subtext sit at ~24px, clearly subordinate.
- Long headlines step down in size deterministically (`fitDisplay`) rather than
  clipping or overlapping.

## Inline markup (copy → type)
- `*word*` → display-serif **italic accent** (the "Habit 01" italic move).
- `==word==` → **maize highlight bar**, ink text.
Templates own all type; briefs carry plain strings with this markup.

## Photography (curated library + Phase 6 generation)
- Real Southern-African contexts, dignified and working (`market.md`).
- The template owns ALL text; photos are atmosphere only.
- Each photo carries manifest metadata (tonality, focal point, text zone);
  bright photos auto-get the strong scrim so maize type always holds contrast.

## The one-swap-file rule
Change the whole look by editing `brand/tokens.json` and running
`npm run tokens`. Nothing downstream hardcodes a value. If you ever find
yourself typing a colour or font into a template, that's a bug.

## Before any design decision scales
Render it, look at it, and — for anything new — get human taste sign-off before
applying it across the system (working-style law). QA catches geometry; a human
catches taste.
