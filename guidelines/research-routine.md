# The Sunday Research Routine

Once a week, before planning, the system's banks get fed and cleaned. This is
the only place new "facts" enter the system — everything downstream (planner,
briefs, slides, captions) consumes the banks, never the open web. Run
`npm run research` for the live checklist; this page is the protocol behind it.

## Order of play

1. **Decide.** Clear the review queue first (`npm run board`, then
   `npm run approve|reject -- <id>`). Undecided briefs block the machine's
   output, and rejection reasons are next week's best editorial signal.

2. **Trends.** Retire expired topics in `intelligence/trends.json` (set
   `status: "expired"` — never delete; history teaches). Then research fresh
   topics. A topic earns entry ONLY with a named source and an expiry date:
   - weather/season outlooks (MSD, SADC, regional El Niño/La Niña advisories)
   - prices & marketing (GMB producer prices, TIMB floor averages, input costs)
   - policy & schemes (input programmes, lending windows, levies)
   - what farmers are asking (story replies, comments, AMA questions)
   The seasonal calendar needs no research — it is fixed and already in the bank.

3. **Hooks.** For every hook shipped 7+ days ago, collect real saves/shares/
   sends, fill `performance`, set `rescored`, and re-score the axes honestly.
   Retire hooks that flopped (`status: "retired"` — never delete). Write new
   candidates for any show `npm run research` flags as dry; score them against
   `guidelines/hook-archetypes.md`; nothing goes `live` under the ship threshold.

4. **Data bank.** Add datapoints the week's research surfaced — value,
   statement, source, year, confidence. Never trim below 50. A stat without a
   source does not exist (Law 5).

5. **Validate.** `npm run intel` after any bank edit. Red means stop.

6. **Plan.** `npm run plan` for the coming week, review the slate, adjust
   banks (not the plan file) if the suggestions are weak — the plan is a pure
   function of the banks, so better banks = better plan. Then author briefs
   from the slots and hand them to `npm run pipeline`.

## Laws that bind this routine

- Every topic and datapoint carries a source. No source, no entry.
- Expiry is mandatory on topics — stale urgency is a lie.
- Performance numbers are real or absent; never estimated.
- The routine edits banks, not outputs. Nothing here approves or publishes.
