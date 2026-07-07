/**
 * image-preview.ts — render sample slides on generated scenes so the image
 * layer's mood can be judged. Runs in whatever mode is active: real
 * gpt-image-1 backgrounds if baked, deterministic placeholders otherwise.
 * All output passes the same QA gate.
 *
 *   npm run images
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, closeBrowser } from "../engine/render.ts";
import { qaSlide } from "../engine/qa.ts";
import * as T from "../engine/templates.ts";
import { hasApiKey } from "../engine/image.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "outputs", "_images");
mkdirSync(outDir, { recursive: true });

const jobs: Array<[string, T.TemplateName, "feed" | "reel", string]> = [
  [
    "01-cover-maize.png",
    "cover",
    "feed",
    T.cover({
      photo: "scene-maize-goldenhour",
      title: "Your Field Is *Talking.* Are You Listening?",
      kicker: "What the crop shows you between planting and tasselling — if you know the signals.",
      slideNo: "SLIDE 01",
    }),
  ],
  [
    "02-insight-soil.png",
    "insight",
    "feed",
    T.insight({
      photo: "scene-red-soil-hands",
      eyebrow: "The Edge",
      title: "Start With\nthe Soil.",
      body: "The cheapest yield you'll ever gain is the fertiliser you *don't* waste placing it blind.",
      slideNo: "SLIDE 02",
    }),
  ],
  [
    "03-case-drought.png",
    "case-study",
    "feed",
    T.caseStudy({
      photo: "scene-dry-cracked-earth",
      eyebrow: "By the numbers",
      title: "The Season That Nearly Wasn't.",
      stats: [
        { value: "−60%", label: "fall in Zimbabwe's 2024 maize harvest under El Niño drought" },
        { value: "5.3M", label: "people projected food-insecure that year" },
      ],
      source: "IFPRI / WFP, 2024",
      slideNo: "SLIDE 03",
    }),
  ],
  [
    "04-hero-reel-soil.png",
    "cover-reel",
    "reel",
    T.coverReel({
      photo: "scene-soil-texture-macro",
      title: "Everything Good Starts ==Underground.==",
      kicker: "Three soil checks before the rains.",
    }),
  ],
  [
    "05-feature-aerial.png",
    "feature",
    "feed",
    T.feature({
      photo: "scene-contour-fields-aerial",
      eyebrow: "Operator lens",
      title: "One Number Per Field.",
      body: "Canopy, moisture and trend, folded into a single call: which field needs you today.",
      ui: {
        field: "FIELD — MUTOKO BLOCK A · MAIZE",
        score: "76",
        band: "WATCH — AMBER BAND",
        action: "Moisture slipping in the north corner. Scout before Thursday.",
      },
      slideNo: "SLIDE 04",
    }),
  ],
];

console.log(`image layer: ${hasApiKey() ? "gpt-image-1 (baked scenes used if present)" : "deterministic placeholder mode"}\n`);

for (const [file, name, format, html] of jobs) {
  const qa = await qaSlide(html, format);
  if (!qa.ok) {
    console.error(`QA FAIL ${file}`);
    for (const e of qa.errors) console.error(`   [${e.rule}] ${e.message}`);
    continue;
  }
  const res = await renderSlide(html, format, join(outDir, file));
  console.log(`rendered ${file} (${name}) ${res.widthPx}×${res.heightPx}`);
}
await closeBrowser();
