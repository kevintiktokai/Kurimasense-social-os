/**
 * render.ts — Chromium HTML→PNG renderer.
 *
 * Renders a self-contained HTML document (tokens.css inlined, fonts as
 * data URIs) to PNG at 2x device scale. Formats come from brand/tokens.json:
 * feed 1080×1350, reel 1080×1920.
 */
import { chromium, type Browser } from "playwright-core";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand", "tokens.json"), "utf8"));

export type Format = "feed" | "reel";

export function formatSize(format: Format): { width: number; height: number } {
  return tokens.format[format];
}

export function tokensCss(): string {
  return readFileSync(join(root, "engine", "tokens.css"), "utf8");
}

/** Wrap slide body markup in a full document with tokens.css inlined. */
export function documentFor(bodyHtml: string, format: Format): string {
  const { width, height } = formatSize(format);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${tokensCss()}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${width}px; height: ${height}px; }
body { overflow: hidden; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
</style></head><body>${bodyHtml}</body></html>`;
}

const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

let shared: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!shared) {
    shared = await chromium.launch({
      executablePath: CHROMIUM,
      args: ["--no-sandbox", "--force-color-profile=srgb", "--font-render-hinting=none"],
    });
  }
  return shared;
}

export async function closeBrowser(): Promise<void> {
  if (shared) {
    await shared.close();
    shared = null;
  }
}

export interface RenderResult {
  outPath: string;
  widthPx: number;
  heightPx: number;
}

/**
 * Render slide body markup to a PNG.
 * Output pixels = format size × tokens.format.scale (2x by default).
 */
export async function renderSlide(
  bodyHtml: string,
  format: Format,
  outPath: string,
): Promise<RenderResult> {
  const { width, height } = formatSize(format);
  const scale = tokens.format.scale as number;
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  try {
    await page.setContent(documentFor(bodyHtml, format), { waitUntil: "networkidle" });
    await page.evaluate(() => (document as any).fonts.ready);
    await page.screenshot({ path: outPath, type: "png" });
  } finally {
    await page.close();
  }
  return { outPath, widthPx: width * scale, heightPx: height * scale };
}
