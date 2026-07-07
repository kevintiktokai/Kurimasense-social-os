/**
 * qa-selftest.ts — proves the gate works, both ways:
 *   1. every archetype sample must PASS
 *   2. the deliberately-broken fixture must FAIL on every expected rule
 * Exit non-zero on any mismatch. Run: npm run qa
 */
import { qaSlide } from "../engine/qa.ts";
import { closeBrowser } from "../engine/render.ts";
import { badSlide } from "../engine/qa-fixture.ts";
import * as T from "../engine/templates.ts";
import { sampleJobs } from "./sample-slides.ts";

let failed = false;

for (const job of sampleJobs()) {
  const report = await qaSlide(job.html, T.templates[job.name].format);
  if (report.ok) {
    console.log(`PASS  ${job.name} (${report.checkedElements} text elements)`);
  } else {
    failed = true;
    console.error(`FAIL  ${job.name}`);
    for (const e of report.errors) {
      console.error(`      [${e.rule}] ${e.message}${e.element ? ` — "${e.element}"` : ""}`);
    }
  }
}

const badReport = await qaSlide(badSlide(), "reel");
const expected = [
  "clip",
  "overlap",
  "contrast",
  "min-size",
  "reel-safe",
  "brand-font",
  "brand-color",
  "logo",
  "highlight-lead",
] as const;
const hit = new Set(badReport.errors.map((e) => e.rule));
const missing = expected.filter((r) => !hit.has(r));
if (badReport.ok || missing.length > 0) {
  failed = true;
  console.error(`FAIL  bad fixture — gate did not catch: ${missing.join(", ") || "anything"}`);
} else {
  console.log(`PASS  bad fixture correctly rejected (${badReport.errors.length} errors across ${hit.size} rules)`);
}

await closeBrowser();
if (failed) {
  console.error("\nQA SELF-TEST FAILED");
  process.exit(1);
}
console.log("\nQA self-test green.");
