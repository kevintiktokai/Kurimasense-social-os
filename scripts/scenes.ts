/**
 * scenes.ts — manage generated background scenes.
 *
 *   npm run scenes            list scenes + whether each is baked
 *   npm run scenes:bake       generate any un-baked scenes via gpt-image-1
 *   npm run scenes:bake -- --force <id...>   re-generate named scenes
 *
 * Baking needs OPENAI_API_KEY in .env. Without it, everything runs in
 * deterministic-placeholder mode and baking is a no-op.
 */
import { listScenes, ensureScene, hasGenerated, hasApiKey, assertBrandSafe, getScene } from "../engine/image.ts";

const argv = process.argv.slice(2);
const bake = argv.includes("bake") || process.env.npm_lifecycle_event === "scenes:bake";
const force = argv.includes("--force");
const named = argv.filter((a) => a.startsWith("scene-"));

// brand-safety check always runs
for (const s of listScenes()) assertBrandSafe(s);

if (!bake) {
  console.log(`${listScenes().length} scenes · API key ${hasApiKey() ? "present" : "absent (placeholder mode)"}\n`);
  for (const s of listScenes()) {
    const state = hasGenerated(s.id) ? "baked" : hasApiKey() ? "not baked" : "placeholder";
    console.log(`  ${s.id.padEnd(28)} ${s.tonality.padEnd(6)} ${state}`);
  }
  console.log(`\nBake real backgrounds with: npm run scenes:bake`);
  process.exit(0);
}

if (!hasApiKey()) {
  console.log("No OPENAI_API_KEY — nothing to bake. Backgrounds use deterministic placeholders.");
  process.exit(0);
}

const targets = named.length ? named.map(getScene) : listScenes();
console.log(`Baking ${targets.length} scene(s)${force ? " (force)" : ""}…`);
for (const s of targets) {
  process.stdout.write(`  ${s.id} … `);
  const r = await ensureScene(s.id, { force });
  console.log(r.kind);
}
console.log("Done.");
