/**
 * planner.ts — Phase 8: the week planner.
 *
 * planWeek(year, week) → plans/<year>-w<ww>.json, a PROPOSED slate:
 * three feed posts (Mon/Wed/Fri) + six interactive stories (Mon–Sat).
 * Shows rotate on a fixed rota so the feed reads as a magazine with regular
 * columns; an active seasonal window can pull Season Watch into the week.
 *
 * Deterministic (Law 2): the plan is a pure function of the ISO week and the
 * banks (hooks, data, trends). No wall clock in the output — `generatedFrom`
 * records the bank versions instead.
 *
 * The plan is advisory: a human (or agent) authors briefs from its slots and
 * every brief still walks the full pipeline — intelligence gate, QA render,
 * human approval. The planner enforces the 80/20 value-first mix by
 * construction and reports it in `mix`.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  shippableHooks,
  datapoints,
  dataBankUpdated,
  hookBankUpdated,
  type DataPoint,
} from "./intelligence.ts";
import {
  activeSeasonal,
  activeTopics,
  mondayOf,
  trendsUpdated,
  type SeasonalWindow,
  type Topic,
} from "./trends.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The six named shows + product show (guidelines/content-pillars.md). */
const SHOWS: Record<
  string,
  { pillar: string; format: "carousel" | "reel-cover" | "single"; template: string; job: string }
> = {
  "The Playbook": { pillar: "field-intelligence", format: "carousel", template: "listicle", job: "teach a method" },
  "The Edge": { pillar: "field-intelligence", format: "reel-cover", template: "insight", job: "one sharp insight" },
  "By The Numbers": { pillar: "the-economics", format: "carousel", template: "case-study", job: "one sourced stat" },
  "The Proof": { pillar: "the-economics", format: "carousel", template: "comparison", job: "show the delta" },
  "Myth vs Method": { pillar: "ground-truth", format: "carousel", template: "comparison", job: "bust a belief" },
  "Season Watch": { pillar: "ground-truth", format: "reel-cover", template: "insight", job: "timely guidance" },
  "Operator Lens": { pillar: "operator-lens", format: "single", template: "feature", job: "product-as-method" },
};

/**
 * The rota. Three consecutive entries per week, stepping 3 per week: every
 * show cycles through, and Operator Lens (the only product show) lands in
 * ~3 weeks out of 7 — comfortably inside the 80/20 law once the six teaching
 * stories are counted.
 */
const ROTA = [
  "The Playbook",
  "By The Numbers",
  "The Edge",
  "Myth vs Method",
  "Season Watch",
  "The Proof",
  "Operator Lens",
];

const POST_DAYS = ["Mon", "Wed", "Fri"] as const;
const STORY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const STORY_TYPES = ["poll", "quiz", "slider", "AMA", "this-or-that", "behind-the-method"];

/** Which data-bank categories feed which pillar. */
const PILLAR_DATA: Record<string, string[]> = {
  "field-intelligence": ["remote-sensing", "precision-ag-roi", "water-irrigation"],
  "the-economics": ["post-harvest-loss", "inputs", "zimbabwe-economy", "precision-ag-roi", "zimbabwe-yields"],
  "ground-truth": ["climate-risk", "zimbabwe-yields", "smallholder-context", "water-irrigation"],
  "operator-lens": ["remote-sensing", "digital-adoption", "precision-ag-roi"],
};

export interface PlanSlot {
  day: string;
  date: string;
  format: string;
  show: string;
  pillar: string;
  templateDefault: string;
  job: string;
  trendAngle: string;
  hookCandidates: Array<{ id: string; text: string; score: number; used: boolean }>;
  dataCandidates: Array<{ id: string; value: string; statement: string; source: string; year: number; confidence: string }>;
}

export interface StorySlot {
  day: string;
  date: string;
  type: string;
  note: string;
  dataCandidate?: { id: string; value: string; statement: string; source: string; year: number };
}

export interface WeekPlan {
  id: string;
  isoYear: number;
  isoWeek: number;
  weekOf: string;
  status: "proposed";
  generatedFrom: { dataBank: string; hooks: string; trends: string };
  seasonalContext: Array<{ id: string; name: string; note: string }>;
  topics: Array<{ id: string; headline: string; source: string; expires: string }>;
  slots: PlanSlot[];
  stories: StorySlot[];
  mix: { posts: number; productPosts: number; stories: number; productShare: number; lawMax: number; ok: boolean };
  next: string;
}

function dateOf(monday: Date, day: string): string {
  const offsets: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + offsets[day]);
  return d.toISOString().slice(0, 10);
}

function hookCandidatesFor(show: string): PlanSlot["hookCandidates"] {
  return shippableHooks()
    .filter((h) => h.show === show)
    .sort((a, b) => Number(a.usedIn.length > 0) - Number(b.usedIn.length > 0) || b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 2)
    .map((h) => ({ id: h.id, text: h.text, score: h.score, used: h.usedIn.length > 0 }));
}

function dataCandidatesFor(pillar: string): PlanSlot["dataCandidates"] {
  const categories = PILLAR_DATA[pillar] ?? [];
  const rank = (d: DataPoint) => (d.confidence === "high" ? 0 : 1);
  return datapoints()
    .filter((d) => d.confidence !== "context" && categories.includes(d.category)) // context never headlines
    .sort((a, b) => rank(a) - rank(b) || categories.indexOf(a.category) - categories.indexOf(b.category) || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((d) => ({ id: d.id, value: d.value, statement: d.statement, source: d.source, year: d.year, confidence: d.confidence }));
}

function trendAngleFor(show: string, seasonal: SeasonalWindow[], live: Topic[]): string {
  const hits = [
    ...seasonal.filter((s) => s.shows.includes(show)).map((s) => `${s.name} — ${s.note}`),
    ...live.filter((t) => t.shows.includes(show)).map((t) => `${t.headline} (${t.source})`),
  ];
  return hits.join(" · ");
}

/** Build the deterministic plan for an ISO week. Pure: does not touch disk. */
export function planWeek(isoYear: number, isoWeek: number): WeekPlan {
  const monday = mondayOf(isoYear, isoWeek);
  const seasonal = activeSeasonal(isoYear, isoWeek);
  const live = activeTopics(isoYear, isoWeek);

  // Rota slice for this week, stepping SLOTS per week so all shows cycle.
  const step = (isoYear * 53 + isoWeek) * POST_DAYS.length;
  const shows = POST_DAYS.map((_, i) => ROTA[(step + i) % ROTA.length]);

  // Season pull: if a window on right now hints Season Watch and the week
  // lacks it, the last non-product slot becomes Season Watch.
  const wantsSeason = seasonal.some((s) => s.shows.includes("Season Watch")) || live.some((t) => t.shows.includes("Season Watch"));
  if (wantsSeason && !shows.includes("Season Watch")) {
    for (let i = shows.length - 1; i >= 0; i--) {
      if (shows[i] !== "Operator Lens") {
        shows[i] = "Season Watch";
        break;
      }
    }
  }

  const slots: PlanSlot[] = shows.map((show, i) => {
    const meta = SHOWS[show];
    return {
      day: POST_DAYS[i],
      date: dateOf(monday, POST_DAYS[i]),
      format: meta.format,
      show,
      pillar: meta.pillar,
      templateDefault: meta.template,
      job: meta.job,
      trendAngle: trendAngleFor(show, seasonal, live),
      hookCandidates: hookCandidatesFor(show),
      dataCandidates: dataCandidatesFor(meta.pillar),
    };
  });

  // Stories: interactive by default; quiz/poll answers must come from the
  // data bank (guidelines/formats.md), so those days carry a datapoint.
  const quizPool = datapoints()
    .filter((d) => d.confidence === "high")
    .sort((a, b) => a.id.localeCompare(b.id));
  const stories: StorySlot[] = STORY_DAYS.map((day, i) => {
    const type = STORY_TYPES[(step + i) % STORY_TYPES.length];
    const slot: StorySlot = {
      day,
      date: dateOf(monday, day),
      type,
      note:
        type === "AMA"
          ? "Field questions AMA — mine replies for next week's hooks."
          : type === "behind-the-method"
            ? "Show the working: how a satellite read becomes a farm decision."
            : "Interactive sticker; answers sourced, never invented.",
    };
    if (type === "poll" || type === "quiz") {
      const d = quizPool[(step + i) % quizPool.length];
      slot.dataCandidate = { id: d.id, value: d.value, statement: d.statement, source: d.source, year: d.year };
    }
    return slot;
  });

  const productPosts = shows.filter((s) => s === "Operator Lens").length;
  const productShare = productPosts / (slots.length + stories.length);

  return {
    id: `${isoYear}-w${String(isoWeek).padStart(2, "0")}`,
    isoYear,
    isoWeek,
    weekOf: monday.toISOString().slice(0, 10),
    status: "proposed",
    generatedFrom: { dataBank: dataBankUpdated(), hooks: hookBankUpdated(), trends: trendsUpdated() },
    seasonalContext: seasonal.map((s) => ({ id: s.id, name: s.name, note: s.note })),
    topics: live.map((t) => ({ id: t.id, headline: t.headline, source: t.source, expires: t.expires })),
    slots,
    stories,
    mix: {
      posts: slots.length,
      productPosts,
      stories: stories.length,
      productShare: Number(productShare.toFixed(3)),
      lawMax: 0.2,
      ok: productShare <= 0.2,
    },
    next: "Author a brief per slot (briefs/<plan-id>-<slug>.json, status draft), then npm run pipeline. Every brief still passes the QA gate and the human decides.",
  };
}

export function savePlan(plan: WeekPlan): string {
  const dir = join(root, "plans");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${plan.id}.json`);
  writeFileSync(path, JSON.stringify(plan, null, 2) + "\n");
  return path;
}
