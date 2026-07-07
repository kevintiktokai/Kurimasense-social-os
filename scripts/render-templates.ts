/**
 * render-templates.ts — renders every archetype sample (scripts/sample-slides.ts)
 * to outputs/_templates/ for human review.
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, closeBrowser } from "../engine/render.ts";
import * as T from "../engine/templates.ts";
import { sampleJobs } from "./sample-slides.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "outputs", "_templates");
mkdirSync(outDir, { recursive: true });

for (const job of sampleJobs()) {
  const res = await renderSlide(job.html, T.templates[job.name].format, join(outDir, job.file));
  console.log(`rendered ${job.file} (${job.name}) ${res.widthPx}×${res.heightPx}`);
}
await closeBrowser();
