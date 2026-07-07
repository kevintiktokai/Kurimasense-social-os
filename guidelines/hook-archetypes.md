# Hook Archetypes

The hook is the whole game on a cover slide and the first line of the caption.
**Law of the hook:** the spoken line (reel) = frame-1 on-screen text = first
line of the caption. One promise, three surfaces, identical wording.

A KurimaSense hook, whatever the archetype, obeys the voice: second person,
a felt cost in time or money, no hype, one idea.

## The eight archetypes
Each hook in `intelligence/hooks.json` is tagged with one of these.

1. **Cost-of-inaction** — name what farming blind costs, concretely.
   *"Your field tells you it's thirsty two weeks too late."*
2. **Counter-intuitive** — challenge a held belief with evidence.
   *"More fertiliser isn't the problem. Placing it blind is."*
3. **Numbered promise** — a countable teach.
   *"Three stress signals satellites catch before your eyes can."*
4. **The tell** — one observable signal that reveals a hidden state.
   *"A stressed canopy runs warm before it wilts. Here's the tell."*
5. **Question-hook** — a question the grower can't not answer.
   *"Which of your blocks would you check first this week?"*
6. **Myth-bust** — "you were taught X; here's what the field shows."
   *"'Green means healthy.' Not always — and here's when it lies."*
7. **Stakes-number** — lead with one sourced figure (data bank).
   *"~20% of the cereals grown here never reach a plate. (FAO)"*
8. **Season-timely** — anchor to the calendar / the rains.
   *"Before the first rains commit your seed — confirm these three."*

## What makes a hook work (the scoring rubric)
Each hook is scored 0–5 on five axes in `hooks.json`; the total (max 25) is
its `score`. Living bank: `measure` re-scores from real saves/shares/sends.

| Axis | 0 | 5 |
|---|---|---|
| **specificity** | vague ("improve yields") | concrete ("Block B, two weeks") |
| **tension** | no stakes | a real cost or surprise |
| **clarity** | needs re-reading | understood in one pass |
| **relevance** | generic | unmistakably this grower, this season |
| **voice-fit** | hypey / generic | direct, senior, anti-hype, local |

A hook scoring < 16 does not ship; rewrite it. Ties break toward the more
specific and more local hook.

## Anti-patterns (auto-fail)
- Hype verbs: unlock, revolutionise, supercharge, game-changer.
- Saviour framing: "empowering", "bringing tech to", "for the poor farmer".
- Fabricated stakes: any number not in the data bank.
- Two ideas fighting for the same hook.
- US-default anything (crops, seasons, spelling, currency).

## The living bank
`intelligence/hooks.json` holds scored hooks with status
(`draft`/`live`/`retired`), the archetype, the pillar/show it serves, and a
`performance` block updated by `measure` (saves, shares, sends, re-score).
High scorers get reused and varied; low performers retire. The bank is how the
system learns what this specific audience actually stops for.
