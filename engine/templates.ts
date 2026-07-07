/**
 * templates.ts — the slide archetype library.
 *
 * Ten parameterised functions, each returning slide body HTML for
 * engine/render.ts. Composition is derived from reference/: full-bleed
 * graded photography, hairline frame (brand top-left, handle top-right,
 * slide № bottom-right — no web address by owner's instruction), maize
 * display serif with italic accents, film grain.
 *
 * Everything visual consumes var(--…) from engine/tokens.css. Copy strings
 * accept inline markup (see markup.ts): *italic accent*, ==highlight==.
 */
import { inline, fitDisplay } from "./markup.ts";
import { photoLayers, getPhoto, type ScrimVariant } from "./photo.ts";
import { grainLayerCss } from "./texture.ts";
import type { Format } from "./render.ts";

// ---------------------------------------------------------------- shared --

/** Classes shared by all templates; consumes tokens only. */
const sharedCss = `
<style>
.accent { font-family: var(--font-display); font-style: italic; }
.hl { background: var(--color-maize); color: var(--color-ink); padding: var(--highlight-padding); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.hl .accent { color: var(--color-ink); }
/* a highlight bar needs open leading or it swallows the line above */
.t-display:has(.hl) { line-height: 1.16; }
</style>`;

export interface FrameOpts {
  slideNo?: string;
  tone?: "cream" | "ink";
  reel?: boolean;
}

/** Reel-safe inset: content must live in the centre 1080×1350 of 1080×1920. */
const REEL_INSET = 285;

export function frame(opts: FrameOpts = {}): string {
  const c = opts.tone === "ink" ? "var(--color-ink)" : "var(--color-cream)";
  const yTop = opts.reel ? `calc(${REEL_INSET}px + var(--rule-inset-y))` : `var(--rule-inset-y)`;
  const yBot = opts.reel ? `calc(${REEL_INSET}px + var(--rule-inset-y))` : `var(--rule-inset-y)`;
  const metaTop = opts.reel ? `${REEL_INSET + 60}px` : `60px`;
  const metaBot = opts.reel ? `${REEL_INSET + 52}px` : `52px`;
  return `
  <div style="position:absolute;left:0;right:0;top:${yTop};border-top:var(--rule-width) solid ${c};"></div>
  <div style="position:absolute;left:0;right:0;bottom:${yBot};border-top:var(--rule-width) solid ${c};"></div>
  <div class="t-meta" style="position:absolute;top:${metaTop};left:var(--margin);color:${c};">KURIMASENSE</div>
  <div class="t-meta" style="position:absolute;top:${metaTop};right:var(--margin);color:${c};">@KURIMASENSE</div>
  ${opts.slideNo ? `<div class="t-meta" style="position:absolute;bottom:${metaBot};right:var(--margin);color:${c};">${opts.slideNo}</div>` : ""}`;
}

export const handArrow = (style: string) => `
  <svg style="${style}" viewBox="0 0 100 130" fill="none">
    <path d="M78 8 C 96 44, 84 86, 46 96 M46 96 l 16 -18 M46 96 l 22 6"
      stroke="var(--color-cream)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  </svg>`;

function slideRoot(format: Format, layers: string): string {
  const size =
    format === "reel"
      ? "width:var(--reel-w);height:var(--reel-h);"
      : "width:var(--feed-w);height:var(--feed-h);";
  return `${sharedCss}<div style="position:relative;${size}background:var(--color-ink);overflow:hidden;">${layers}</div>`;
}

function photoBase(photoId: string, scrim?: ScrimVariant, focalPoint?: string): string {
  return `${photoLayers(photoId, { scrim, focalPoint })}<div style="${grainLayerCss()}"></div>`;
}

// -------------------------------------------------------------- archetypes --

export interface CoverParams {
  photo: string;
  title: string;
  kicker?: string;
  slideNo?: string;
  arrow?: boolean;
}

/** 1 · cover — feed carousel opener. Text zone follows the photo manifest. */
export function cover(p: CoverParams): string {
  const photo = getPhoto(p.photo);
  const size = fitDisplay(p.title, 126);
  const zone =
    photo.textZone === "lower"
      ? `bottom:200px;`
      : `top:270px;`;
  return slideRoot("feed", `
  ${photoBase(p.photo)}
  ${frame({ slideNo: p.slideNo ?? "SLIDE 01" })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);${zone}">
    <div class="t-display" style="color:var(--color-maize);font-size:${size}px;">${inline(p.title)}</div>
    ${p.kicker ? `<div class="t-kicker" style="color:var(--color-maize);margin-top:40px;max-width:760px;font-size:24px;">${inline(p.kicker)}</div>` : ""}
  </div>
  ${p.arrow !== false && photo.textZone === "upper" ? handArrow("position:absolute;right:120px;top:150px;width:115px;height:145px;") : ""}`);
}

export interface CoverReelParams {
  photo: string;
  title: string;
  kicker?: string;
}

/** 2 · cover-reel — 1080×1920 with all content in the centre safe zone. */
export function coverReel(p: CoverReelParams): string {
  const size = fitDisplay(p.title, 120);
  return slideRoot("reel", `
  ${photoBase(p.photo, "strong")}
  ${frame({ reel: true })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:${REEL_INSET + 250}px;">
    <div class="t-display" style="color:var(--color-maize);font-size:${size}px;">${inline(p.title)}</div>
    ${p.kicker ? `<div class="t-kicker" style="color:var(--color-maize);margin-top:38px;max-width:740px;font-size:24px;">${inline(p.kicker)}</div>` : ""}
  </div>
  <div class="t-meta" style="position:absolute;left:var(--margin);bottom:${REEL_INSET + 52}px;color:var(--color-cream);">WATCH — FULL BREAKDOWN</div>`);
}

export interface InsightParams {
  photo: string;
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "right";
  slideNo?: string;
}

/** 3 · insight — interior teaching slide (refs 2–5 composition). */
export function insight(p: InsightParams): string {
  const photo = getPhoto(p.photo);
  const size = fitDisplay(p.title, 114, 72);
  const right = (p.align ?? "right") === "right";
  const zone = photo.textZone === "lower" ? "top:560px;" : "top:250px;";
  return slideRoot("feed", `
  ${photoBase(p.photo, "lower")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);${zone}text-align:${right ? "right" : "left"};">
    <div class="t-eyebrow" style="color:var(--color-maize);">${inline(p.eyebrow)}</div>
    <div class="t-display" style="color:var(--color-maize);font-size:${size}px;margin-top:6px;">${inline(p.title)}</div>
    <div class="t-body" style="color:var(--color-maize);margin-top:34px;max-width:700px;${right ? "margin-left:auto;" : ""}">${inline(p.body)}</div>
  </div>`);
}

export interface ListicleParams {
  photo: string;
  title: string;
  items: Array<{ label: string; text?: string }>;
  slideNo?: string;
}

/** 4 · listicle — numbered points over a strongly-scrimmed photo. */
export function listicle(p: ListicleParams): string {
  const rows = p.items
    .map(
      (it, i) => `
    <div style="display:flex;gap:34px;align-items:baseline;padding:34px 0;border-top:var(--rule-width) solid rgba(242,237,227,0.35);">
      <div class="t-eyebrow" style="color:var(--color-maize);min-width:86px;">${String(i + 1).padStart(2, "0")}</div>
      <div>
        <div class="t-display" style="color:var(--color-maize);font-size:52px;">${inline(it.label)}</div>
        ${it.text ? `<div class="t-body" style="color:var(--color-cream);font-size:27px;margin-top:10px;max-width:700px;">${inline(it.text)}</div>` : ""}
      </div>
    </div>`,
    )
    .join("");
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:200px;">
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.title, 96, 62)}px;margin-bottom:44px;">${inline(p.title)}</div>
    ${rows}
  </div>`);
}

export interface ComparisonParams {
  photo: string;
  title: string;
  bad: { label: string; items: string[] };
  good: { label: string; items: string[] };
  slideNo?: string;
}

/** 5 · comparison — bad-vs-good stacked panels. */
export function comparison(p: ComparisonParams): string {
  const li = (items: string[], mark: string, color: string) =>
    items
      .map(
        (t) => `<div style="display:flex;gap:20px;align-items:baseline;margin-top:16px;">
          <div class="t-body-strong" style="color:${color};font-size:30px;">${mark}</div>
          <div class="t-body" style="color:${color};font-size:30px;">${inline(t)}</div>
        </div>`,
      )
      .join("");
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:190px;">
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.title, 96, 62)}px;">${inline(p.title)}</div>
    <div style="margin-top:44px;background:rgba(30,25,16,0.72);border:var(--rule-width) solid rgba(242,237,227,0.35);padding:44px 48px;">
      <div class="t-kicker" style="color:var(--color-cream);opacity:0.85;">${inline(p.bad.label)}</div>
      ${li(p.bad.items, "✕", "var(--color-cream)")}
    </div>
    <div style="margin-top:28px;background:var(--color-maize);padding:44px 48px;">
      <div class="t-kicker" style="color:var(--color-ink);">${inline(p.good.label)}</div>
      ${li(p.good.items, "✓", "var(--color-ink)")}
    </div>
  </div>`);
}

export interface CaseStudyParams {
  photo: string;
  eyebrow: string;
  title: string;
  stats: Array<{ value: string; label: string }>;
  source: string;
  slideNo?: string;
}

/** 6 · case-study — evidence slide; every number needs a source line. */
export function caseStudy(p: CaseStudyParams): string {
  const stats = p.stats
    .map(
      (s) => `
    <div style="flex:1;border-top:var(--rule-width) solid rgba(242,237,227,0.4);padding-top:26px;">
      <div class="t-display" style="color:var(--color-maize);font-size:96px;">${inline(s.value)}</div>
      <div class="t-body" style="color:var(--color-cream);font-size:28px;margin-top:10px;">${inline(s.label)}</div>
    </div>`,
    )
    .join("");
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:230px;">
    <div class="t-eyebrow" style="color:var(--color-maize);">${inline(p.eyebrow)}</div>
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.title, 102, 66)}px;margin-top:8px;">${inline(p.title)}</div>
    <div style="display:flex;gap:44px;margin-top:64px;">${stats}</div>
    <div class="t-meta" style="color:var(--color-cream);opacity:0.75;margin-top:56px;">SOURCE — ${inline(p.source)}</div>
  </div>`);
}

export interface QuestionParams {
  photo: string;
  question: string;
  cta: string;
  slideNo?: string;
}

/** 7 · question / CTA — closer slide engineered for saves & sends. */
export function question(p: QuestionParams): string {
  const photo = getPhoto(p.photo);
  const anchor =
    photo.textZone === "lower"
      ? "justify-content:flex-end;padding-bottom:240px;"
      : "justify-content:center;";
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:0;bottom:0;display:flex;flex-direction:column;${anchor}align-items:center;text-align:center;">
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.question, 112, 70)}px;max-width:860px;">${inline(p.question)}</div>
    <div class="t-kicker" style="margin-top:56px;background:var(--color-maize);color:var(--color-ink);padding:24px 44px;font-size:24px;">${inline(p.cta)}</div>
  </div>`);
}

const ICONS: Record<string, string> = {
  satellite: `<path d="M24 4 L34 14 L26 22 L16 12 Z M16 12 L10 18 M26 22 L32 28 M8 26 c 4 6, 10 10, 14 10 M4 30 c 5 8, 14 14, 20 14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  drop: `<path d="M24 6 C 24 6, 10 22, 10 32 a 14 14 0 0 0 28 0 C 38 22, 24 6, 24 6 Z M18 32 a 6 6 0 0 0 6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  chart: `<path d="M8 8 V 40 H 44 M16 32 L24 22 L30 27 L40 14 M40 14 h -7 M40 14 v 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  leaf: `<path d="M10 38 C 10 20, 22 10, 40 10 C 40 28, 28 38, 12 38 M14 34 C 20 26, 28 20, 36 14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  alert: `<path d="M24 6 L44 40 H4 Z M24 20 v 9 M24 34 v 1" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  coin: `<circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M24 15 v 18 M29 18 c -6 -3, -11 0, -10 4 c 1 4, 9 3, 10 7 c 1 4, -5 6, -10 3" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
};

export interface IconRowParams {
  photo: string;
  title: string;
  items: Array<{ icon: keyof typeof ICONS | string; label: string; text: string }>;
  slideNo?: string;
}

/** 8 · icon-row — three-up capability/summary slide. */
export function iconRow(p: IconRowParams): string {
  const cols = p.items
    .map(
      (it) => `
    <div style="flex:1;border-top:var(--rule-width) solid rgba(242,237,227,0.4);padding-top:34px;">
      <svg viewBox="0 0 48 48" style="width:76px;height:76px;color:var(--color-maize);">${ICONS[it.icon] ?? ICONS.leaf}</svg>
      <div class="t-display" style="color:var(--color-maize);font-size:44px;margin-top:22px;">${inline(it.label)}</div>
      <div class="t-body" style="color:var(--color-cream);font-size:27px;margin-top:12px;">${inline(it.text)}</div>
    </div>`,
    )
    .join("");
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:230px;">
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.title, 98, 64)}px;">${inline(p.title)}</div>
    <div style="display:flex;gap:40px;margin-top:70px;">${cols}</div>
  </div>`);
}

export interface HeroParams {
  photo: string;
  line: string;
  slideNo?: string;
}

/** 9 · hero — full-bleed photo, one held line. */
export function hero(p: HeroParams): string {
  const photo = getPhoto(p.photo);
  const zone = photo.textZone === "lower" ? "bottom:220px;" : "top:300px;";
  return slideRoot("feed", `
  ${photoBase(p.photo)}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);${zone}">
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.line, 134, 80)}px;max-width:860px;">${inline(p.line)}</div>
  </div>`);
}

export interface FeatureParams {
  photo: string;
  eyebrow: string;
  title: string;
  body: string;
  ui: { score: string; band: string; field: string; action: string };
  slideNo?: string;
}

/** 10 · feature — product moment: token-built KurimaScore card over photo. */
export function feature(p: FeatureParams): string {
  return slideRoot("feed", `
  ${photoBase(p.photo, "strong")}
  ${frame({ slideNo: p.slideNo })}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:210px;">
    <div class="t-eyebrow" style="color:var(--color-maize);">${inline(p.eyebrow)}</div>
    <div class="t-display" style="color:var(--color-maize);font-size:${fitDisplay(p.title, 98, 64)}px;margin-top:8px;">${inline(p.title)}</div>
  </div>
  <div style="position:absolute;left:var(--margin);right:var(--margin);bottom:200px;">
    <div style="background:rgba(30,25,16,0.88);border:var(--rule-width) solid rgba(242,237,227,0.4);padding:48px 52px;max-width:700px;">
      <div class="t-meta" style="color:var(--color-cream);opacity:0.7;">${inline(p.ui.field)}</div>
      <div style="display:flex;align-items:baseline;gap:26px;margin-top:18px;">
        <div class="t-display" style="color:var(--color-maize);font-size:110px;">${inline(p.ui.score)}</div>
        <div class="t-kicker" style="color:var(--color-maize);font-size:26px;">${inline(p.ui.band)}</div>
      </div>
      <div style="border-top:var(--rule-width) solid rgba(242,237,227,0.3);margin-top:26px;padding-top:24px;">
        <div class="t-body" style="color:var(--color-cream);font-size:28px;">${inline(p.ui.action)}</div>
      </div>
    </div>
    <div class="t-body" style="color:var(--color-maize);margin-top:36px;max-width:760px;font-size:30px;">${inline(p.body)}</div>
  </div>`);
}

// ---------------------------------------------------------------- registry --

export const templates = {
  cover: { format: "feed" as Format, render: cover },
  "cover-reel": { format: "reel" as Format, render: coverReel },
  insight: { format: "feed" as Format, render: insight },
  listicle: { format: "feed" as Format, render: listicle },
  comparison: { format: "feed" as Format, render: comparison },
  "case-study": { format: "feed" as Format, render: caseStudy },
  question: { format: "feed" as Format, render: question },
  "icon-row": { format: "feed" as Format, render: iconRow },
  hero: { format: "feed" as Format, render: hero },
  feature: { format: "feed" as Format, render: feature },
};

export type TemplateName = keyof typeof templates;
