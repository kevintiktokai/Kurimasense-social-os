/**
 * sample-slides.ts — the canonical archetype sample set, shared by the
 * template review renderer (render-templates.ts) and the QA self-test.
 */
import * as T from "../engine/templates.ts";

export interface SampleJob {
  file: string;
  name: T.TemplateName;
  html: string;
}

export function sampleJobs(): SampleJob[] {
  return [
    {
      file: "01-cover.png",
      name: "cover",
      html: T.cover({
        photo: "ox-plough-storm",
        title: "Your Field Tells You It's Thirsty *two weeks* Too Late.",
        kicker: "Five stress signals satellites catch before your eyes can — this season, not next.",
        slideNo: "SLIDE 01",
      }),
    },
    {
      file: "02-cover-reel.png",
      name: "cover-reel",
      html: T.coverReel({
        photo: "hoe-wetland",
        title: "Stop Walking Your Fields ==Blind.==",
        kicker: "Three checks before you spend another dollar on inputs.",
      }),
    },
    {
      file: "03-insight.png",
      name: "insight",
      html: T.insight({
        photo: "tractor-maize",
        eyebrow: "Signal 01",
        title: "Canopy\nCooling Lag.",
        body: "A water-stressed canopy warms before it wilts.\n\nThermal readings pick up the lag days before leaves curl — while irrigation can still save the stand.",
        slideNo: "SLIDE 02",
      }),
    },
    {
      file: "04-listicle.png",
      name: "listicle",
      html: T.listicle({
        photo: "greenhouse-tomatoes",
        title: "Three Checks Before You Spray.",
        items: [
          { label: "Scout the *hotspot,* not the field.", text: "Stress maps show you exactly which corner is sliding — start there." },
          { label: "Confirm on foot.", text: "Satellite narrows it down; your eyes confirm the cause." },
          { label: "Record what you did.", text: "Next season's decisions are only as good as this season's records." },
        ],
        slideNo: "SLIDE 03",
      }),
    },
    {
      file: "05-comparison.png",
      name: "comparison",
      html: T.comparison({
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
    },
    {
      file: "06-case-study.png",
      name: "case-study",
      html: T.caseStudy({
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
    },
    {
      file: "07-question.png",
      name: "question",
      html: T.question({
        photo: "farmer-portrait",
        question: "Which block would you check *first* this week?",
        cta: "SAVE THIS — SEND IT TO YOUR AGRONOMIST",
        slideNo: "SLIDE 06",
      }),
    },
    {
      file: "08-icon-row.png",
      name: "icon-row",
      html: T.iconRow({
        photo: "tractor-maize",
        title: "What the Score Watches.",
        items: [
          { icon: "satellite", label: "Canopy", text: "Vigour and stress, field by field, every few days." },
          { icon: "drop", label: "Moisture", text: "Water balance against what your crop needs this stage." },
          { icon: "chart", label: "Trend", text: "Whether this week is better or worse than last — and why." },
        ],
        slideNo: "SLIDE 07",
      }),
    },
    {
      file: "09-hero.png",
      name: "hero",
      html: T.hero({
        photo: "farmer-portrait",
        line: "Kurima. *Sense.*",
        slideNo: "SLIDE 08",
      }),
    },
    {
      file: "10-feature.png",
      name: "feature",
      html: T.feature({
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
    },
  ];
}
