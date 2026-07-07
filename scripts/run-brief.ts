/**
 * run-brief.ts — render one brief to its review bundle.
 *
 *   npm run brief -- <brief-id>
 *
 * PNGs + caption.md + alt.txt + why.md + qa-report.json land in
 * outputs/<brief-id>/. Exits non-zero if any slide fails the QA gate.
 * On success the brief status advances draft → review (never further:
 * approval is the human's).
 */
import { loadBrief, saveBrief, renderBrief } from "../engine/brief.ts";
import { closeBrowser } from "../engine/render.ts";

const id = process.argv[2];
if (!id) {
  console.error("usage: npm run brief -- <brief-id>");
  process.exit(2);
}

const brief = loadBrief(id);
const result = await renderBrief(brief);

for (const s of result.slides) {
  if (s.qa.ok) {
    console.log(`PASS  ${s.file} (${s.template})`);
  } else {
    console.error(`FAIL  ${s.file} (${s.template})`);
    for (const e of s.qa.errors) {
      console.error(`      [${e.rule}] ${e.message}${e.element ? ` — "${e.element}"` : ""}`);
    }
  }
}

await closeBrowser();

if (!result.ok) {
  console.error(`\nQA gate blocked the bundle — nothing advances to review. See ${result.outDir}/qa-report.json`);
  process.exit(1);
}

if (brief.status === "draft") {
  brief.status = "review";
  saveBrief(brief);
}
console.log(`\nReview bundle ready: ${result.outDir} (status: ${brief.status} — awaiting human approval)`);
