/**
 * build-tokens.ts — generates engine/tokens.css from brand/tokens.json.
 *
 * brand/tokens.json is the ONLY place colours, gradients, type roles,
 * formats, margins and fonts are defined. Everything downstream consumes
 * the generated CSS custom properties (var(--…)) — never raw values.
 *
 * Fonts are embedded as base64 data URIs so a rendered document is fully
 * self-contained: same tokens.json → byte-identical tokens.css → same render.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand", "tokens.json"), "utf8"));

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

let css = `/* GENERATED from brand/tokens.json — do not edit by hand. Run: npm run tokens */\n\n`;

// ---- @font-face --------------------------------------------------------
for (const [role, font] of Object.entries<any>(tokens.fonts)) {
  for (const f of font.files) {
    const buf = readFileSync(join(root, "brand", "fonts", f.file));
    css += `@font-face {\n  font-family: '${font.name}';\n  font-weight: ${f.weight};\n  font-style: ${f.style};\n  font-display: block;\n  src: url(data:font/woff2;base64,${buf.toString("base64")}) format('woff2');\n}\n`;
  }
  void role;
}

// ---- custom properties -------------------------------------------------
css += `\n:root {\n`;

for (const [name, value] of Object.entries<string>(tokens.color)) {
  css += `  --color-${kebab(name)}: ${value};\n`;
}
for (const [name, value] of Object.entries<string>(tokens.gradient)) {
  css += `  --grad-${kebab(name)}: ${value};\n`;
}
for (const [roleName, font] of Object.entries<any>(tokens.fonts)) {
  css += `  --font-${kebab(roleName)}: '${font.name}';\n`;
}
for (const [role, t] of Object.entries<any>(tokens.type)) {
  const r = kebab(role);
  css += `  --type-${r}-family: var(--font-${kebab(t.family)});\n`;
  css += `  --type-${r}-weight: ${t.weight};\n`;
  css += `  --type-${r}-style: ${t.style};\n`;
  css += `  --type-${r}-size: ${t.sizePx}px;\n`;
  css += `  --type-${r}-leading: ${t.leading};\n`;
  css += `  --type-${r}-tracking: ${t.tracking};\n`;
  css += `  --type-${r}-case: ${t.case === "upper" ? "uppercase" : "none"};\n`;
}
css += `  --margin: ${tokens.layout.marginPx}px;\n`;
css += `  --rule-inset-y: ${tokens.layout.ruleInsetYPx}px;\n`;
css += `  --rule-width: ${tokens.layout.ruleWidthPx}px;\n`;
css += `  --highlight-padding: ${tokens.layout.highlightPadding};\n`;
css += `  --grain-opacity: ${tokens.texture.grainOpacity};\n`;
css += `  --feed-w: ${tokens.format.feed.width}px;\n`;
css += `  --feed-h: ${tokens.format.feed.height}px;\n`;
css += `  --reel-w: ${tokens.format.reel.width}px;\n`;
css += `  --reel-h: ${tokens.format.reel.height}px;\n`;
css += `}\n`;

// ---- type role utility classes (consume only vars) ---------------------
for (const role of Object.keys(tokens.type)) {
  const r = kebab(role);
  css += `\n.t-${r} {\n  font-family: var(--type-${r}-family);\n  font-weight: var(--type-${r}-weight);\n  font-style: var(--type-${r}-style);\n  font-size: var(--type-${r}-size);\n  line-height: var(--type-${r}-leading);\n  letter-spacing: var(--type-${r}-tracking);\n  text-transform: var(--type-${r}-case);\n}\n`;
}

writeFileSync(join(root, "engine", "tokens.css"), css);
console.log(`engine/tokens.css written (${(css.length / 1024).toFixed(0)} KiB)`);
