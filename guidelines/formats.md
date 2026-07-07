# Formats

## Canvas sizes (from `brand/tokens.json`)
- **Feed carousel** — 1080×1350 (4:5), rendered at 2x → 2160×2700.
- **Reel cover** — 1080×1920 (9:16), rendered at 2x → 2160×3840.
  All content lives in the **centre safe zone** (1080×1350) so nothing hides
  under Instagram's UI. Enforced by the QA gate's `reel-safe` rule.

## When to use each
| Format | Use for | Shows |
|---|---|---|
| Carousel (feed) | teaching with depth, steps, proof | Playbook, By The Numbers, Proof, Myth vs Method |
| Reel | reach, hooks, motion, one big idea | The Edge, Season Watch, hook tests |
| Single feed image | one insight / quote / stat | The Edge, By The Numbers |
| Story | polls, quizzes, AMAs, behind-the-method | all — see below |

## Carousel length
6–8 slides default. Never pad to fill; never cram two ideas to save a slide.
Minimum viable carousel = hook + one unit of value + a save/send close.

## Reels
The cover is what the engine renders; the **script** is authored in the brief /
week plan (see `plan_week` in later phases). Reel discipline:
- 3-second hook: the spoken first line = frame-1 text = caption line 1.
- Beats every 3–5s with spoken line / on-screen text / shot / b-roll.
- A payoff and one CTA. Audio direction noted.

## Stories (6 days/week in the planner)
Interactive by default — polls, quizzes, sliders, AMA stickers. **Quiz and
poll answers must come from the data bank**, never invented. Stories are where
the audience talks back; mine that for hooks.

## Caption structure
1. Hook line (identical to cover frame-1).
2. 2–4 short paragraphs of the teach, in voice.
3. The turn / takeaway.
4. Explicit save/send instruction.
5. Line break, then hashtags (7–12, from the market set).
6. **First comment** carries sources for any stat used (transparency).

## Alt text (accessibility — required per slide)
Every slide in a brief has `alt_text` describing the image and the words on it.
The QA/brief loader rejects a brief with a missing alt_text.

## Aspect & quality
Export PNG at 2x. Photos graded via token filter, embedded as data URIs for
deterministic, self-contained renders. No external asset calls at render time.
