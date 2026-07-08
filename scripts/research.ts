/**
 * research.ts — the Sunday research routine's opening report.
 *
 *   npm run research
 *
 * Prints what the week's research session must deal with: stale topics,
 * hooks awaiting real performance numbers, shows running out of fresh hooks,
 * bank freshness, and the seasonal context for the coming week. The protocol
 * itself lives in guidelines/research-routine.md; this command is its
 * checklist generator. It changes nothing on disk.
 */
import { datapoints, hooks, shippableHooks, dataBankUpdated, hookBankUpdated } from "../engine/intelligence.ts";
import { activeSeasonal, activeTopics, isoWeekOf, topics, trendsUpdated } from "../engine/trends.ts";
import { listBriefs } from "../engine/pipeline.ts";

const today = new Date();
const iso = today.toISOString().slice(0, 10);
const next = new Date(today);
next.setUTCDate(today.getUTCDate() + 7);
const nw = isoWeekOf(next);

console.log(`SUNDAY RESEARCH — ${iso}`);
console.log(`banks: data ${dataBankUpdated()} · hooks ${hookBankUpdated()} · trends ${trendsUpdated()}\n`);

// 1. Board first — reviews waiting on the human block everything else.
const waiting = listBriefs().filter((b) => b.status === "review");
console.log(`1. DECIDE (${waiting.length} in review)`);
for (const b of waiting) console.log(`   npm run approve|reject -- ${b.id}`);
if (!waiting.length) console.log("   nothing waiting.");

// 2. Retire stale topics; hunt new ones (sourced or they don't exist).
const stale = topics().filter((t) => t.status === "live" && t.expires < iso);
console.log(`\n2. TRENDS (${topics().filter((t) => t.status === "live").length} live topics)`);
for (const t of stale) console.log(`   retire '${t.id}' — expired ${t.expires}`);
console.log("   research fresh topics per guidelines/research-routine.md; every topic needs source + observed + expires.");

// 3. Hooks: shipped ones need real numbers; shows running dry need writing.
const unscored = hooks().filter((h) => h.usedIn.length > 0 && h.performance.rescored === null);
console.log(`\n3. HOOKS`);
for (const h of unscored) console.log(`   collect saves/shares/sends for '${h.id}' (shipped in ${h.usedIn.join(", ")}) and rescore`);
const SHOW_NAMES = ["The Playbook", "The Edge", "By The Numbers", "The Proof", "Myth vs Method", "Season Watch", "Operator Lens"];
for (const show of SHOW_NAMES) {
  const fresh = shippableHooks().filter((h) => h.show === show && h.usedIn.length === 0).length;
  if (fresh === 0) console.log(`   '${show}' has no fresh shippable hook — write and score candidates`);
}

// 4. Data bank: keep it growing and current.
const dp = datapoints();
console.log(`\n4. DATA BANK (${dp.length} datapoints, law minimum 50)`);
console.log("   add anything the week's research surfaced — value, statement, source, year, confidence.");

// 5. Seasonal context for the week being planned.
console.log(`\n5. NEXT WEEK (${nw.year}-w${String(nw.week).padStart(2, "0")})`);
for (const s of activeSeasonal(nw.year, nw.week)) console.log(`   in season: ${s.name}`);
for (const t of activeTopics(nw.year, nw.week)) console.log(`   live topic: ${t.headline}`);

console.log(`\n6. PLAN: npm run plan   →   author briefs from the slots   →   npm run pipeline`);
console.log("\nRun npm run intel after any bank edit.");
