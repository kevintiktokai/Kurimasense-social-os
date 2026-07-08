/**
 * plan-selftest.ts — prove the planner's laws.
 *
 *   npm run plan:test
 *
 * Determinism, the 80/20 mix law, shippable-hooks-only, no context-confidence
 * stats, ISO week math, and full show rotation over a season.
 */
import { planWeek } from "../engine/planner.ts";
import { shippableHooks, getDatapoint } from "../engine/intelligence.ts";
import { checkTrendsIntegrity, isoWeekOf, mondayOf, monthsOfWeek } from "../engine/trends.ts";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}: ${(e as Error).message}`);
    failures++;
  }
}

check("trends bank integrity", () => {
  const issues = checkTrendsIntegrity();
  if (issues.length) throw new Error(issues.map((i) => `${i.id}: ${i.message}`).join("; "));
});

check("ISO week math", () => {
  const w = isoWeekOf(new Date(Date.UTC(2026, 6, 8))); // 2026-07-08
  if (w.year !== 2026 || w.week !== 28) throw new Error(`2026-07-08 → ${w.year}-w${w.week}, expected 2026-w28`);
  const jan1 = isoWeekOf(new Date(Date.UTC(2027, 0, 1))); // Friday → still 2026-w53
  if (jan1.year !== 2026 || jan1.week !== 53) throw new Error(`2027-01-01 → ${jan1.year}-w${jan1.week}, expected 2026-w53`);
  if (mondayOf(2026, 28).toISOString().slice(0, 10) !== "2026-07-06") throw new Error("Monday of 2026-w28 is not 2026-07-06");
  const months = monthsOfWeek(2026, 27); // Mon 29 Jun – Sun 5 Jul straddles the boundary
  if (months.join(",") !== "6,7") throw new Error(`2026-w27 months ${months}, expected 6,7`);
});

check("deterministic: same week → identical plan", () => {
  const a = JSON.stringify(planWeek(2026, 29));
  const b = JSON.stringify(planWeek(2026, 29));
  if (a !== b) throw new Error("two runs differ");
});

check("52 weeks: mix law, shippable hooks, sourced stats", () => {
  const shippable = new Set(shippableHooks().map((h) => h.id));
  for (let week = 1; week <= 52; week++) {
    const plan = planWeek(2026, week);
    if (!plan.mix.ok) throw new Error(`${plan.id}: product share ${plan.mix.productShare} breaks the 80/20 law`);
    if (plan.mix.productPosts > 1) throw new Error(`${plan.id}: more than one product post`);
    for (const slot of plan.slots) {
      for (const h of slot.hookCandidates) {
        if (!shippable.has(h.id)) throw new Error(`${plan.id} ${slot.day}: hook '${h.id}' is not shippable`);
      }
      for (const d of slot.dataCandidates) {
        if (getDatapoint(d.id).confidence === "context") {
          throw new Error(`${plan.id} ${slot.day}: context-confidence stat '${d.id}' offered as headline`);
        }
      }
    }
    for (const s of plan.stories) {
      if (s.dataCandidate) getDatapoint(s.dataCandidate.id); // must resolve
    }
  }
});

check("every show appears across a quarter", () => {
  const seen = new Set<string>();
  for (let week = 1; week <= 13; week++) {
    for (const slot of planWeek(2026, week).slots) seen.add(slot.show);
  }
  if (seen.size < 7) throw new Error(`only ${seen.size}/7 shows appear in 13 weeks: ${[...seen].join(", ")}`);
});

check("season pull: rainy-season weeks carry Season Watch", () => {
  // Week 46 of 2026 sits in November — first-planting-rains hints Season Watch.
  const plan = planWeek(2026, 46);
  const hasSeasonal = plan.seasonalContext.length > 0;
  if (hasSeasonal && plan.seasonalContext.some((s) => s.id === "first-planting-rains")) {
    if (!plan.slots.some((s) => s.show === "Season Watch")) {
      throw new Error("first rains active but no Season Watch slot");
    }
  }
});

if (failures > 0) {
  console.error(`\n${failures} planner self-test failure(s).`);
  process.exit(1);
}
console.log("\nPlanner self-test green.");
