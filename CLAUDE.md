# KurimaSense Content OS — Operating Manual

Autonomous Instagram content system for KurimaSense (kurimasense.vercel.app):
researches, ideates, writes, designs, QAs and packages content end-to-end,
in-brand, with ONE human approval gate. NEVER auto-publishes.

## Mission

KurimaSense sells the end of farming on guesswork. Satellite field
intelligence (KurimaScore, stress alerts, yield models) for Zimbabwean
farmers — smallholder and commercial — plus the offtakers, lenders and
insurers around them. Educator first, builder second. Direct, senior,
evidence-led, anti-hype. British/SA spelling, USD, Zimbabwe furniture
(seasons, crops, mukando, Agritex officers, market days). Never
"bringing tech to Africa" saviour framing. Speak to one person.

## Law (non-negotiable)

1. **Brand by construction** — `brand/tokens.json` is the ONE swap file
   (colours, gradients, type roles, fonts, formats, margins, texture).
   `engine/tokens.css` is GENERATED from it (`npm run tokens`). Components
   consume only `var(--…)`. Nothing hardcodes a colour or font. Fonts
   self-hosted in `brand/fonts/` (embedded as data URIs at build).
2. **Deterministic** — same brief → same output. Grain is seeded SVG
   turbulence; placeholders are token gradients; no render-time randomness.
3. **Human approval gate** — automated QA catches geometry; a human catches
   taste. Approval happens before anything is queued. NEVER auto-publish.
4. **Explainability** — every output ships a "why this works" note.
5. **No fabricated numbers** — every stat comes from
   `intelligence/data-bank.json` with source + year.
6. **Secrets only in `.env`** (gitignored).

## Commands

```bash
npm run tokens      # brand/tokens.json → engine/tokens.css
npm run typecheck   # tsc --noEmit (must be clean before any phase is done)
npm run templates   # render all archetype samples → outputs/_templates/
npm run qa          # QA self-test: 10 samples must PASS, bad fixture must FAIL
npm run brief -- <id>   # render briefs/<id>.json → outputs/<id>/ review bundle
npm run pipeline    # all draft briefs → intelligence gate → QA render → review, then board
npm run board       # status board of every brief, no rendering
npm run approve -- <id>          # HUMAN ONLY: review → approved
npm run reject -- <id> <reason>  # HUMAN ONLY: review → rejected (reason required)
npm run rework -- <id>           # HUMAN ONLY: rejected → draft for another pass
npm run pipeline:test   # lifecycle self-test: machine can never approve/publish
npm run trends      # what's timely: seasonal windows + live sourced topics
npm run plan        # week plan → plans/<yyyy>-w<ww>.json (next | this | <yyyy>-w<ww>)
npm run plan:test   # planner self-test: determinism, 80/20 law, shippable-only
npm run research    # Sunday research checklist (see guidelines/research-routine.md)
npm run intel       # validate data bank (50+ sourced) + hook bank against laws
npm run scenes      # list generated background scenes + bake state
npm run scenes:bake # generate scenes via gpt-image-1 (needs OPENAI_API_KEY)
npm run images      # render sample slides on generated scenes (preview)
```

## The loop (so far)

brief json (status draft) → `npm run pipeline` → intelligence gate (hook must
be a live, shippable id in intelligence/hooks.json) → render each slide →
hard QA gate (engine/qa.ts) → review bundle (PNGs + caption.md + alt.txt +
why.md + qa-report.json) → status review → STOP. The human decides with
`npm run approve|reject|rework -- <id>`; every transition is appended to the
brief's `history`. Approved briefs wait for Phase 10 — the machine can never
approve or publish (enforced in engine/pipeline.ts, proven by
`npm run pipeline:test`).

## Visual system (derived from reference/)

- Composition: full-bleed warm imagery, dark scrim, hairline rules top
  (y=100) and bottom (y=h−100), brand top-left / handle top-right / slide №
  bottom-right, 96px side margins, film grain. NO web address on slides
  (owner's instruction, 2026-07).
- Photos: curated library in assets/photos/ with manifest (mood, tonality,
  focal point, text zone). Templates respect textZone; bright photos get the
  strong scrim automatically. The template owns ALL text.
- Palette: maize `#E6CF55` (display type on photos), cream `#F2EDE3`
  (meta on dark), ink `#1E1910`, olive `#55603A`, earth `#8A6A4B`,
  clay `#C9B698`. `maizeDeep #8A7A1E` is the accent on light grounds.
- Type: Playfair Display (display 500, italic accents, eyebrow italic) ·
  Poppins (body 400, kicker/meta 600 caps). Roles + sizes in tokens.json.
- Formats: feed 1080×1350, reel 1080×1920, rendered at 2x. Reel-safe zone =
  centre 1080×1350.

## Repo map

```
content-os/
  reference/          5 inspiration slides the system is derived from
  brand/tokens.json   THE swap file
  brand/fonts/        self-hosted woff2 (OFL)
  engine/render.ts    Chromium HTML→PNG (playwright-core, /opt/pw-browsers/chromium)
  engine/texture.ts   deterministic seeded grain
  engine/tokens.css   GENERATED — do not edit
  scripts/            build-tokens, phase renders
  outputs/            renders (gitignored)
```

## Build status

- [x] Phase 1 — foundation: scaffold, tokens.json derived from reference/,
      tokens.css generator, grain generator, Chromium renderer, approval
      pack rendered (awaiting human approval of palette + type).
- [x] Phase 2 — 10 slide archetypes in engine/templates.ts (cover,
      cover-reel, insight, listicle, comparison, case-study, question,
      icon-row, hero, feature) + markup.ts inline accents/highlights +
      deterministic fitDisplay sizing. Review set: npx tsx
      scripts/render-templates.ts → outputs/_templates/.
- [x] Phase 3 — QA gate (engine/qa.ts): clip, overlap, highlight-lead,
      pixel-measured contrast (4.5/3.0), min-size, reel-safe, brand
      font/colour, logo. Self-test with mandatory-fail fixture: npm run qa.
- [x] Phase 4 — brief schema + render-from-brief (engine/brief.ts,
      npm run brief -- <id>); first brief: briefs/2026-w28-stress-signals.json
- [x] Phase 5 — content intelligence: brand/voice.md, guidelines/{content-pillars,
      carousel-arc,hook-archetypes,formats,market,compliance,design-rules}.md,
      six named shows across 4 pillars, intelligence/data-bank.json (52
      WEB-RESEARCHED sourced stats), intelligence/hooks.json (scored, living),
      engine/intelligence.ts loader enforcing the laws (npm run intel).
- [x] Phase 6 — image layer: brand/art-direction.json (photographic house
      style swap file, reference mood + farming domain), assets/generated/
      scenes.json (12 named farming/nature scenes), engine/image.ts (gpt-image-1
      generation cached by scene, deterministic on-palette placeholder when no
      key, brand-safety lint), scenes resolve through photo.ts exactly like
      library photos. Preview: npm run images. Bake: npm run scenes:bake
      (needs OPENAI_API_KEY in .env).
- [x] Phase 7 — pipeline with human gate: engine/pipeline.ts lifecycle state
      machine (draft→review machine-only-via-green-QA; review→approved/rejected
      human-only; publish hard-blocked until Phase 10), per-brief `history`
      audit trail, intelligence gate on shippable hooks + usedIn bookkeeping,
      board (npm run pipeline / board), human commands (approve/reject/rework),
      lifecycle self-test (npm run pipeline:test).
- [x] Phase 8 — trend engine + week planner + Sunday research routine:
      intelligence/trends.json (fixed Zimbabwean seasonal calendar + live
      topics, source + expiry mandatory), engine/trends.ts (ISO-week maths,
      active windows/topics, integrity in npm run intel), engine/planner.ts
      (deterministic week plan: 3 posts Mon/Wed/Fri on a 7-show rota with
      seasonal Season Watch pull + 6 interactive stories with data-bank-fed
      quiz/poll answers; 80/20 mix enforced by construction), plans/ (proposed
      slates, committed), guidelines/research-routine.md + npm run research
      (Sunday checklist: decide → trends → hooks → data → validate → plan),
      planner self-test (npm run plan:test).
- [ ] Phase 9 — dashboard (web/, Vercel, Supabase state)
- [ ] Phase 10 — publishing (Supabase hosting, Buffer queue), repurposing,
      learning report
