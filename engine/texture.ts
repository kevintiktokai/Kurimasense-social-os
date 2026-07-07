/**
 * texture.ts — deterministic film-grain overlay.
 *
 * The reference set is photographic with visible warm grain. We reproduce
 * that with an SVG feTurbulence data URI: given the same seed and
 * baseFrequency from brand/tokens.json, the output is byte-identical —
 * no randomness at render time.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand", "tokens.json"), "utf8"));

export function grainDataUri(): string {
  const { grainSeed, grainBaseFrequency } = tokens.texture;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">` +
    `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="${grainBaseFrequency}" numOctaves="2" seed="${grainSeed}" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="220" height="220" filter="url(#g)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** CSS for a full-bleed grain layer; opacity comes from tokens. */
export function grainLayerCss(): string {
  return `position:absolute;inset:0;background-image:url(${grainDataUri()});background-size:220px 220px;opacity:var(--grain-opacity);mix-blend-mode:overlay;pointer-events:none;`;
}
