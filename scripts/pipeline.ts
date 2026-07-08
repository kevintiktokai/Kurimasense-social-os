/**
 * pipeline.ts — run the machine half of the loop, then show the board.
 *
 *   npm run pipeline          # every draft brief → intelligence gate → QA render → review
 *   npm run board             # board only, no rendering
 *
 * The pipeline stops at review. Approving is the human's:
 * npm run approve|reject|rework -- <id>.
 */
import { listBriefs, processDrafts } from "../engine/pipeline.ts";
import { closeBrowser } from "../engine/render.ts";

const boardOnly = process.argv[2] === "board";

let failed = false;
if (!boardOnly) {
  const runs = await processDrafts();
  await closeBrowser();
  if (runs.length === 0) {
    console.log("No draft briefs to process.");
  }
  for (const run of runs) {
    console.log(`${run.ok ? "PASS" : "FAIL"}  ${run.id}`);
    for (const note of run.notes) console.log(`      ${note}`);
    if (!run.ok) failed = true;
  }
  console.log("");
}

console.log("BOARD");
for (const b of listBriefs()) {
  const last = b.history?.at(-1);
  const trail = last ? ` — ${last.by} ${last.at.slice(0, 10)}${last.reason ? ` (${last.reason})` : ""}` : "";
  console.log(`  ${b.status.padEnd(9)} ${b.id}  [${b.pillar} · ${b.show}]${trail}`);
}
console.log("\nreview → awaiting human decision · approved → awaiting Phase 10 publishing. Nothing publishes itself.");

if (failed) process.exit(1);
