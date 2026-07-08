/**
 * plan.ts — generate the week plan.
 *
 *   npm run plan               # next ISO week
 *   npm run plan -- this       # current ISO week
 *   npm run plan -- 2026-w41   # any ISO week
 *
 * Writes plans/<year>-w<ww>.json (status: proposed) and prints the slate.
 * The plan is deterministic for a given week + banks; regenerating after a
 * bank change is expected and safe.
 */
import { planWeek, savePlan } from "../engine/planner.ts";
import { isoWeekOf } from "../engine/trends.ts";

const arg = process.argv[2] ?? "next";
let year: number, week: number;

const m = arg.match(/^(\d{4})-w(\d{1,2})$/i);
if (m) {
  year = Number(m[1]);
  week = Number(m[2]);
} else if (arg === "this") {
  ({ year, week } = isoWeekOf(new Date()));
} else if (arg === "next") {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 7);
  ({ year, week } = isoWeekOf(next));
} else {
  console.error("usage: npm run plan -- [this | next | <yyyy>-w<ww>]");
  process.exit(2);
}

const plan = planWeek(year, week);
const path = savePlan(plan);

console.log(`WEEK PLAN ${plan.id} (week of ${plan.weekOf}) — ${plan.status}\n`);
if (plan.seasonalContext.length) {
  console.log(`In season: ${plan.seasonalContext.map((s) => s.name).join(" · ")}\n`);
}
for (const s of plan.slots) {
  console.log(`${s.day} ${s.date}  ${s.show}  [${s.pillar} · ${s.format} · ${s.templateDefault}]`);
  if (s.trendAngle) console.log(`    angle: ${s.trendAngle.split(" · ")[0]}`);
  for (const h of s.hookCandidates) {
    console.log(`    hook:  ${h.text}  (${h.score}/25${h.used ? ", used before" : ""})`);
  }
  if (s.dataCandidates[0]) {
    console.log(`    stat:  ${s.dataCandidates[0].value} — ${s.dataCandidates[0].statement} (${s.dataCandidates[0].source}, ${s.dataCandidates[0].year})`);
  }
}
console.log(`\nStories: ${plan.stories.map((s) => `${s.day} ${s.type}`).join(" · ")}`);
console.log(
  `Mix: ${plan.mix.productPosts}/${plan.mix.posts + plan.mix.stories} product = ${(plan.mix.productShare * 100).toFixed(0)}% (law ≤ ${plan.mix.lawMax * 100}%) ${plan.mix.ok ? "OK" : "VIOLATION"}`,
);
console.log(`\nSaved: ${path}`);
console.log(plan.next);

if (!plan.mix.ok) process.exit(1);
