/**
 * render-templates.ts — renders every archetype with sample KurimaSense copy
 * to outputs/_templates/ for human review. The FAO post-harvest figure in the
 * case-study sample is a real, sourced statistic (the no-fabrication law
 * applies to samples too).
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, closeBrowser } from "../engine/render.ts";
import * as T from "../engine/templates.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "outputs", "_templates");
mkdirSync(outDir, { recursive: true });

const jobs: Array<[string, T.TemplateName, string]> = [
  [
    "01-cover.png",
    "cover",
    T.cover({
      photo: "ox-plough-storm",
      title: "Your Field Tells You It's Thirsty *two weeks* Too Late.",
      kicker: "Five stress signals satellites catch before your eyes can — this season, not next.",
      slideNo: "SLIDE 01",
    }),
  ],
  [
    "02-cover-reel.png",
    "cover-reel",
    T.coverReel({
      photo: "hoe-wetland",
      title: "Stop Walking Your Fields ==Blind.==",
      kicker: "Three checks before you spend another dollar on inputs.",
    }),
  ],
  [
    "03-insight.png",
    "insight",
    T.insight({
      photo: "tractor-maize",
      eyebrow: "Signal 01",
      title: "Canopy\nCooling Lag.",
      body: "A water-stressed canopy warms before it wilts.\n\nThermal readings pick up the lag days before leaves curl — while irrigation can still save the stand.",
      slideNo: "SLIDE 02",
    }),
  ],
  [
    "04-listicle.png",
    "listicle",
    T.listicle({
      photo: "greenhouse-tomatoes",
      title: "Three Checks Before You Spray.",
      items: [
        { label: "Scout the *hotspot,* not the field.", text: "Stress maps show you exactly which corner is sliding — start there." },
        { label: "Confirm on foot.", text: "Satellite narrows it down; your eyes confirm the cause." },
        { label: "Record what you did.", text: "Next season's decisions are only as good as this season's records." },
      ],
      slideNo: "SLIDE 03",
    }),
  ],
  [
    "05-comparison.png",
    "comparison",
    T.comparison({
      photo: "hoe-wetland",
      title: "Guesswork vs *Evidence.*",
      bad: {
        label: "Farming blind",
        items: ["Spray the whole field, every time", "Find problems at harvest", "Price your crop on rumour"],
      },
      good: {
        label: "Farming on evidence",
        items: ["Treat the block that needs it", "Catch stress in week one", "Sell on real market signals"],
      },
      slideNo: "SLIDE 04",
    }),
  ],
  [
    "06-case-study.png",
    "case-study",
    T.caseStudy({
      photo: "ox-plough-storm",
      eyebrow: "By the numbers",
      title: "The Cost of Finding Out at Harvest.",
      stats: [
        { value: "30–40%", label: "of Sub-Saharan Africa's food production is lost after harvest" },
        { value: "$4bn+", label: "annual value of those losses across the region" },
      ],
      source: "FAO / World Bank, 2023",
      slideNo: "SLIDE 05",
    }),
  ],
  [
    "07-question.png",
    "question",
    T.question({
      photo: "farmer-portrait",
      question: "Which block would you check *first* this week?",
      cta: "SAVE THIS — SEND IT TO YOUR AGRONOMIST",
      slideNo: "SLIDE 06",
    }),
  ],
  [
    "08-icon-row.png",
    "icon-row",
    T.iconRow({
      photo: "tractor-maize",
      title: "What the Score Watches.",
      items: [
        { icon: "satellite", label: "Canopy", text: "Vigour and stress, field by field, every few days." },
        { icon: "drop", label: "Moisture", text: "Water balance against what your crop needs this stage." },
        { icon: "chart", label: "Trend", text: "Whether this week is better or worse than last — and why." },
      ],
      slideNo: "SLIDE 07",
    }),
  ],
  [
    "09-hero.png",
    "hero",
    T.hero({
      photo: "farmer-portrait",
      line: "Kurima. *Sense.*",
      slideNo: "SLIDE 08",
    }),
  ],
  [
    "10-feature.png",
    "feature",
    T.feature({
      photo: "greenhouse-tomatoes",
      eyebrow: "Operator lens",
      title: "One Number Per Field.",
      body: "The KurimaScore folds canopy, moisture and trend into a single call: which field needs you today.",
      ui: {
        field: "FIELD — MUONDE BLOCK B · MAIZE",
        score: "82",
        band: "STEADY — GREEN BAND",
        action: "Holding steady. Recheck after this week's heat run.",
      },
      slideNo: "SLIDE 09",
    }),
  ],
];

for (const [file, name, html] of jobs) {
  const res = await renderSlide(html, T.templates[name].format, join(outDir, file));
  console.log(`rendered ${file} (${name}) ${res.widthPx}×${res.heightPx}`);
}
await closeBrowser();
