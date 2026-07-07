# KurimaSense Content OS

An autonomous Instagram content operating system for **KurimaSense**
(kurimasense.vercel.app) — it researches, ideates, writes, designs, QAs and
packages on-brand content end-to-end, with **one human approval gate**. It
never auto-publishes.

> KurimaSense sells the end of farming on guesswork: satellite field
> intelligence for Zimbabwean growers. This system produces its Instagram
> presence — in the exact brand, from evidence, at weekly cadence.

## What it does

```
brief → image → render → QA gate → review bundle → [HUMAN APPROVES] → publish
```

- **Brand by construction.** `brand/tokens.json` is the single swap file
  (colours, gradients, type roles, fonts, formats, margins). `engine/tokens.css`
  is generated from it; components consume only `var(--…)`. Nothing hardcodes a
  colour or font. Fonts are self-hosted.
- **Deterministic.** Same brief → same output. Seeded grain, token gradients,
  cached generated imagery.
- **A hard QA gate** (`engine/qa.ts`) blocks clipping, overlap, low contrast,
  under-size text, reel-safe-zone breaches and off-brand colour/type — measured
  on the real rendered pixels — before anything reaches a human.
- **No fabricated numbers.** Every stat comes from
  `intelligence/data-bank.json` with a source and year.
- **Human taste gate stays.** Automated checks catch geometry; a human catches
  taste. Approval happens before anything is queued.

## Quick start

```bash
npm install
npm run tokens      # generate engine/tokens.css from brand/tokens.json
npm run typecheck   # tsc --noEmit
npm run qa          # QA self-test: 10 archetypes must pass, bad fixture must fail
```

Render the sample brief to a review bundle:

```bash
npm run brief -- 2026-w28-stress-signals
# → outputs/2026-w28-stress-signals/ : slide PNGs + caption.md + alt.txt + why.md + qa-report.json
```

## Commands

| Command | Does |
|---|---|
| `npm run tokens` | `brand/tokens.json` → `engine/tokens.css` |
| `npm run templates` | render all 10 archetype samples → `outputs/_templates/` |
| `npm run qa` | QA self-test (samples pass, broken fixture fails) |
| `npm run brief -- <id>` | render a brief → review bundle |
| `npm run intel` | validate data bank (50+ sourced) + hook bank |
| `npm run scenes` | list generated background scenes + bake state |
| `npm run scenes:bake` | generate backgrounds via gpt-image-1 (needs `OPENAI_API_KEY`) |
| `npm run images` | render sample slides on generated scenes |

## Repo map

```
brand/            tokens.json (THE swap file), voice.md, art-direction.json, fonts/
engine/           render, tokens generator, templates, qa, brief, photo, image, intelligence
guidelines/       content-pillars, carousel-arc, hook-archetypes, formats, market, compliance, design-rules
intelligence/     data-bank.json (52 sourced stats), hooks.json (scored, living)
assets/           photos/ (curated library) + generated/ (scenes.json + baked gpt-image-1)
briefs/           <id>.json — the unit of work
reference/        the inspiration set the visual system is derived from
scripts/          CLI entry points
outputs/          renders (gitignored)
```

## Configuration

Copy `.env.example` to `.env` (gitignored) and fill in as needed. The image
layer runs in deterministic-placeholder mode with no key; add `OPENAI_API_KEY`
and `npm run scenes:bake` to generate real backgrounds.

## Operating manual

See **[CLAUDE.md](./CLAUDE.md)** for the full operating manual: mission, the
loop, brand laws, QA gates, build status.

## Status

Phases 1–6 complete (foundation, templates, QA gate, brief pipeline, content
intelligence, image layer). Phases 7–10 (pipeline orchestration, week planner +
trend engine, dashboard, publishing) in progress.
