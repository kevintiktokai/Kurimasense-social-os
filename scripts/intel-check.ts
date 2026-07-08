/**
 * intel-check.ts — validates the data bank, hook bank and trends bank
 * against the laws.
 *   npm run intel
 * Exits non-zero on any integrity issue.
 */
import { checkIntegrity, datapoints, hooks, shippableHooks } from "../engine/intelligence.ts";
import { checkTrendsIntegrity, seasonalWindows, topics } from "../engine/trends.ts";

const issues = [
  ...checkIntegrity(),
  ...checkTrendsIntegrity().map((i) => ({ kind: "trends", id: i.id, message: i.message })),
];
const dp = datapoints();
const hk = hooks();

console.log(`data bank: ${dp.length} datapoints`);
console.log(`hook bank: ${hk.length} hooks (${shippableHooks().length} shippable)`);
console.log(`trends bank: ${seasonalWindows().length} seasonal windows, ${topics().length} topics`);

if (issues.length) {
  for (const i of issues) console.error(`  [${i.kind}] ${i.id}: ${i.message}`);
  console.error("\nINTELLIGENCE CHECK FAILED");
  process.exit(1);
}

if (dp.length < 50) {
  console.error(`\ndata bank has ${dp.length} datapoints — the law requires 50+.`);
  process.exit(1);
}

console.log("\nIntelligence banks green.");
