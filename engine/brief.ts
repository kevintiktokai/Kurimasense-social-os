/**
 * brief.ts — the brief is the unit of work.
 *
 * briefs/<id>.json describes one post end-to-end: pillar, show, hook,
 * template-shaped slide copy, caption, first comment, per-slide alt text,
 * hashtags, rationale, status. One call renders it: PNGs → hard QA gate →
 * review bundle (caption.md / alt.txt / why.md / qa-report.json).
 *
 * Statuses: draft → review → approved | rejected → published.
 * Rendering never advances status past "review" — approval is human-only.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, type Format } from "./render.ts";
import { qaSlide, type QAReport } from "./qa.ts";
import { templates, type TemplateName } from "./templates.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface BriefSlide {
  template: TemplateName;
  params: Record<string, unknown>;
  alt_text: string;
}

/** One lifecycle move, appended by the pipeline — the brief carries its own audit trail. */
export interface Transition {
  at: string;
  from: Brief["status"];
  to: Brief["status"];
  by: "machine" | "human";
  reason?: string;
}

export interface Brief {
  id: string;
  created: string;
  pillar: string;
  show: string;
  /** id of a hook in intelligence/hooks.json — the pipeline enforces it is live and shippable */
  hook: string;
  format: "carousel" | "reel-cover";
  slides: BriefSlide[];
  caption: string;
  first_comment: string;
  hashtags: string[];
  rationale: string;
  status: "draft" | "review" | "approved" | "rejected" | "published";
  history?: Transition[];
}

export function loadBrief(id: string): Brief {
  const path = join(root, "briefs", `${id}.json`);
  const brief = JSON.parse(readFileSync(path, "utf8")) as Brief;
  for (const s of brief.slides) {
    if (!templates[s.template]) throw new Error(`brief ${id}: unknown template '${s.template}'`);
    if (!s.alt_text?.trim()) throw new Error(`brief ${id}: slide missing alt_text`);
  }
  if (!brief.rationale?.trim()) throw new Error(`brief ${id}: missing rationale (explainability law)`);
  return brief;
}

export function saveBrief(brief: Brief): void {
  writeFileSync(join(root, "briefs", `${brief.id}.json`), JSON.stringify(brief, null, 2) + "\n");
}

export interface BriefRenderResult {
  ok: boolean;
  outDir: string;
  slides: Array<{ file: string; template: TemplateName; qa: QAReport }>;
}

/** Render a brief end-to-end. QA failures hard-block the bundle. */
export async function renderBrief(brief: Brief): Promise<BriefRenderResult> {
  const outDir = join(root, "outputs", brief.id);
  mkdirSync(outDir, { recursive: true });

  const results: BriefRenderResult["slides"] = [];
  let allOk = true;

  for (let i = 0; i < brief.slides.length; i++) {
    const slide = brief.slides[i];
    const t = templates[slide.template];
    const html = (t.render as (p: any) => string)(slide.params);
    const qa = await qaSlide(html, t.format as Format);
    const file = `slide-${String(i + 1).padStart(2, "0")}.png`;
    if (qa.ok) {
      await renderSlide(html, t.format as Format, join(outDir, file));
    } else {
      allOk = false;
    }
    results.push({ file, template: slide.template, qa });
  }

  // review bundle
  writeFileSync(
    join(outDir, "qa-report.json"),
    JSON.stringify(
      results.map((r) => ({ file: r.file, template: r.template, ok: r.qa.ok, errors: r.qa.errors })),
      null,
      2,
    ) + "\n",
  );

  if (allOk) {
    const caption = `${brief.caption}\n\n.\n.\n.\n${brief.hashtags.join(" ")}\n`;
    writeFileSync(join(outDir, "caption.md"), `# Caption\n\n${caption}\n\n# First comment\n\n${brief.first_comment}\n`);
    writeFileSync(
      join(outDir, "alt.txt"),
      brief.slides.map((s, i) => `slide-${String(i + 1).padStart(2, "0")}: ${s.alt_text}`).join("\n") + "\n",
    );
    writeFileSync(
      join(outDir, "why.md"),
      `# Why this works\n\n${brief.rationale}\n\n— pillar: ${brief.pillar} · show: ${brief.show} · hook: ${brief.hook}\n`,
    );
  }

  return { ok: allOk, outDir, slides: results };
}
