/**
 * trends.ts — what is timely for a given week.
 *
 *   npm run trends              # this week
 *   npm run trends -- 2026-w41  # any ISO week
 */
import { activeSeasonal, activeTopics, isoWeekOf, mondayOf, topics } from "../engine/trends.ts";

const arg = process.argv[2];
const m = arg?.match(/^(\d{4})-w(\d{1,2})$/i);
const { year, week } = m ? { year: Number(m[1]), week: Number(m[2]) } : isoWeekOf(new Date());

console.log(`Trends for ${year}-w${String(week).padStart(2, "0")} (week of ${mondayOf(year, week).toISOString().slice(0, 10)})\n`);

console.log("SEASONAL WINDOWS ON NOW");
for (const s of activeSeasonal(year, week)) {
  console.log(`  ${s.name}  [${s.shows.join(", ")}]`);
  console.log(`    ${s.note}`);
}

const live = activeTopics(year, week);
console.log(`\nLIVE TOPICS (${live.length})`);
for (const t of live) {
  console.log(`  ${t.headline} — ${t.source} (expires ${t.expires})`);
}
if (live.length === 0) {
  console.log("  none — the Sunday research routine (npm run research) adds sourced topics.");
}

const stale = topics().filter((t) => t.status === "live" && t.expires < new Date().toISOString().slice(0, 10));
if (stale.length) {
  console.log(`\nSTALE (live but past expiry — retire on Sunday): ${stale.map((t) => t.id).join(", ")}`);
}
