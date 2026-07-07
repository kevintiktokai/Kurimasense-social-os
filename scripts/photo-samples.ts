/**
 * photo-samples.ts — renders sample slides on the real photo library so the
 * photo + scrim + grain + type combination can be approved before the full
 * template set (Phase 2) is built.
 *
 *   outputs/_phase1/photo-cover.png     cover on ox-plough-storm (text upper)
 *   outputs/_phase1/photo-insight.png   interior slide on tractor-maize (right-aligned, like refs 2/4)
 *   outputs/_phase1/photo-portrait.png  cover variant on farmer-portrait (text lower)
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSlide, closeBrowser } from "../engine/render.ts";
import { grainLayerCss } from "../engine/texture.ts";
import { photoLayers } from "../engine/photo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "outputs", "_phase1");
mkdirSync(outDir, { recursive: true });

function frame(slideNo: string): string {
  return `
  <div style="position:absolute;left:0;right:0;top:var(--rule-inset-y);border-top:var(--rule-width) solid var(--color-cream);"></div>
  <div style="position:absolute;left:0;right:0;bottom:var(--rule-inset-y);border-top:var(--rule-width) solid var(--color-cream);"></div>
  <div class="t-meta" style="position:absolute;top:60px;left:var(--margin);color:var(--color-cream);">KURIMASENSE</div>
  <div class="t-meta" style="position:absolute;top:60px;right:var(--margin);color:var(--color-cream);">@KURIMASENSE</div>
  
  <div class="t-meta" style="position:absolute;bottom:52px;right:var(--margin);color:var(--color-cream);">${slideNo}</div>`;
}

const arrow = (style: string, flip = false) => `
  <svg style="${style}" viewBox="0 0 100 130" fill="none" ${flip ? 'transform="scale(-1,1)"' : ""}>
    <path d="M78 8 C 96 44, 84 86, 46 96 M46 96 l 16 -18 M46 96 l 22 6"
      stroke="var(--color-cream)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  </svg>`;

// 1 — cover, text upper, on the ox-plough storm photo
const cover = `
<div style="position:relative;width:var(--feed-w);height:var(--feed-h);background:var(--color-ink);">
  ${photoLayers("ox-plough-storm")}
  <div style="${grainLayerCss()}"></div>
  ${frame("SLIDE 01")}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:270px;">
    <div class="t-display" style="color:var(--color-maize);font-size:112px;">Your Field Tells<br/>You It's Thirsty<br/><span class="t-display-italic" style="font-size:112px;">two weeks</span> Too<br/>Late.</div>
    <div class="t-kicker" style="color:var(--color-maize);margin-top:38px;max-width:780px;font-size:27px;">
      Five stress signals satellites catch before your eyes can — this season, not next.
    </div>
  </div>
  ${arrow("position:absolute;right:120px;top:150px;width:115px;height:145px;")}
</div>`;

// 2 — interior insight, right-aligned lower text, on the tractor photo
const insight = `
<div style="position:relative;width:var(--feed-w);height:var(--feed-h);background:var(--color-ink);">
  ${photoLayers("tractor-maize", { scrim: "lower" })}
  <div style="${grainLayerCss()}"></div>
  ${frame("SLIDE 02")}
  <div style="position:absolute;left:var(--margin);right:var(--margin);top:560px;text-align:right;">
    <div class="t-eyebrow" style="color:var(--color-maize);">Signal 01</div>
    <div class="t-display" style="color:var(--color-maize);font-size:104px;margin-top:6px;">Canopy<br/>Cooling Lag.</div>
    <div class="t-body" style="color:var(--color-maize);margin-top:34px;margin-left:auto;max-width:700px;">
      A water-stressed canopy warms before it wilts.
      <br/><br/>Thermal readings pick up the lag days before leaves curl — while irrigation can still save the stand.
    </div>
  </div>
</div>`;

// 3 — cover variant, text lower, on the farmer portrait
const portrait = `
<div style="position:relative;width:var(--feed-w);height:var(--feed-h);background:var(--color-ink);">
  ${photoLayers("farmer-portrait")}
  <div style="${grainLayerCss()}"></div>
  ${frame("SLIDE 01")}
  <div style="position:absolute;left:var(--margin);right:var(--margin);bottom:200px;">
    <div class="t-display" style="color:var(--color-maize);font-size:108px;">She Stopped<br/>Guessing.<br/><span class="t-display-italic" style="font-size:108px;">The margin</span><br/>Followed.</div>
    <div class="t-kicker" style="color:var(--color-maize);margin-top:36px;max-width:760px;font-size:27px;">
      What changes when every input decision starts with evidence.
    </div>
  </div>
</div>`;

const slides: Array<[string, string]> = [
  ["photo-cover.png", cover],
  ["photo-insight.png", insight],
  ["photo-portrait.png", portrait],
];

for (const [file, html] of slides) {
  const res = await renderSlide(html, "feed", join(outDir, file));
  console.log(`rendered ${file} ${res.widthPx}×${res.heightPx}`);
}
await closeBrowser();
