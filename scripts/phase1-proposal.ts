/**
 * phase1-proposal.ts — renders the Phase 1 approval pack:
 *   outputs/_phase1/tokens-sheet.png   palette swatches + type roles
 *   outputs/_phase1/sample-cover.png   cover archetype in the reference composition
 *
 * The sample cover uses the deterministic placeholder gradient + grain in
 * place of photography (image layer arrives in Phase 6), so what's being
 * approved here is exactly: palette, type roles, frame furniture, composition.
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, closeBrowser } from "../engine/render.ts";
import { grainLayerCss } from "../engine/texture.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "outputs", "_phase1");
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- frame --
// Shared header/footer furniture matching the reference set: hairline rules,
// brand top-left, handle top-right, site bottom-left, slide no. bottom-right.
function frame(slideNo: string, light = true): string {
  const c = light ? "var(--color-cream)" : "var(--color-ink)";
  return `
  <div style="position:absolute;left:0;right:0;top:var(--rule-inset-y);border-top:var(--rule-width) solid ${c};"></div>
  <div style="position:absolute;left:0;right:0;bottom:var(--rule-inset-y);border-top:var(--rule-width) solid ${c};"></div>
  <div class="t-meta" style="position:absolute;top:60px;left:var(--margin);color:${c};">KURIMASENSE</div>
  <div class="t-meta" style="position:absolute;top:60px;right:var(--margin);color:${c};">@KURIMASENSE</div>
  
  <div class="t-meta" style="position:absolute;bottom:52px;right:var(--margin);color:${c};">${slideNo}</div>`;
}

// ------------------------------------------------------------ tokens sheet
function swatch(name: string, varName: string, hex: string, dark = false): string {
  return `<div style="flex:1;display:flex;flex-direction:column;gap:10px;">
    <div style="height:150px;background:var(${varName});border:1px solid rgba(30,25,16,0.14);"></div>
    <div class="t-meta" style="color:var(--color-ink);font-size:19px;">${name}</div>
    <div class="t-meta" style="color:var(--color-ink);opacity:0.55;font-size:17px;letter-spacing:0.04em;">${hex}${dark ? " · TEXT-SAFE ON CREAM" : ""}</div>
  </div>`;
}

const tokensSheet = `
<div style="position:relative;width:var(--feed-w);height:var(--feed-h);background:var(--color-cream);">
  ${frame("BRAND TOKENS", false)}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:140px;">
    <div class="t-eyebrow" style="color:var(--color-maize-deep);font-size:44px;">Derived from reference/</div>
    <div class="t-display" style="color:var(--color-ink);font-size:80px;margin-top:6px;">The KurimaSense visual system.</div>

    <div class="t-kicker" style="color:var(--color-ink);margin-top:44px;opacity:0.8;font-size:24px;">Palette — maize, soil, foliage, first light</div>
    <div style="display:flex;gap:18px;margin-top:18px;">
      ${swatch("Maize", "--color-maize", "#E6CF55")}
      ${swatch("Cream", "--color-cream", "#F2EDE3")}
      ${swatch("Ink", "--color-ink", "#1E1910")}
      ${swatch("Olive", "--color-olive", "#55603A")}
      ${swatch("Earth", "--color-earth", "#8A6A4B")}
      ${swatch("Clay", "--color-clay", "#C9B698")}
    </div>

    <div class="t-kicker" style="color:var(--color-ink);margin-top:48px;opacity:0.8;font-size:24px;">Type roles — Playfair Display · Poppins, self-hosted</div>
    <div style="margin-top:20px;display:flex;flex-direction:column;gap:22px;">
      <div class="t-display" style="color:var(--color-ink);font-size:64px;">Display — Grow on <span class="t-display-italic" style="font-size:64px;color:var(--color-maize-deep);">evidence.</span></div>
      <div class="t-eyebrow" style="color:var(--color-maize-deep);font-size:44px;">Eyebrow italic — Field Note 01</div>
      <div class="t-body" style="color:var(--color-ink);max-width:840px;font-size:30px;">Body — Plain answers about your fields, from satellite evidence. Built for Zimbabwe's seasons, priced in USD.</div>
      <div style="display:flex;gap:44px;align-items:baseline;">
        <div class="t-kicker" style="color:var(--color-ink);font-size:24px;">Kicker — The Playbook</div>
        <div class="t-meta" style="color:var(--color-ink);opacity:0.7;">Meta — 24PX CAPS</div>
      </div>
    </div>
  </div>
</div>`;

// ------------------------------------------------------------ sample cover
const sampleCover = `
<div style="position:relative;width:var(--feed-w);height:var(--feed-h);background:var(--grad-placeholder-dawn);">
  <div style="position:absolute;inset:0;background:var(--grad-scrim-photo);"></div>
  <div style="${grainLayerCss()}"></div>
  ${frame("SLIDE 01")}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:420px;">
    <div class="t-display" style="color:var(--color-maize);font-size:108px;">Signs Your Maize<br/>Is Under Stress<br/><span class="t-display-italic" style="font-size:108px;">before</span> You Can<br/>See It.</div>
    <div class="t-kicker" style="color:var(--color-maize);margin-top:40px;max-width:800px;font-size:28px;">
      What satellite evidence picks up in week one — and your eyes only catch in week three.
    </div>
  </div>
  <svg style="position:absolute;right:200px;top:218px;width:140px;height:175px;" viewBox="0 0 100 130" fill="none">
    <path d="M78 8 C 96 44, 84 86, 46 96 M46 96 l 16 -18 M46 96 l 22 6"
      stroke="var(--color-cream)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  </svg>
</div>`;

const covers: Array<[string, string, "feed" | "reel"]> = [
  ["tokens-sheet.png", tokensSheet, "feed"],
  ["sample-cover.png", sampleCover, "feed"],
];

for (const [file, html, format] of covers) {
  const res = await renderSlide(html, format, join(outDir, file));
  console.log(`rendered ${file} ${res.widthPx}×${res.heightPx}`);
}
await closeBrowser();
