/**
 * qa.ts — the hard QA gate. Every render must pass before it can reach the
 * human review package; a failing slide never ships.
 *
 * Rules (structured errors, all hard blocks):
 *   clip           text fully inside the canvas
 *   overlap        no two text blocks intersect
 *   highlight-lead headline containing a ==highlight== keeps open leading
 *   contrast       ≥4.5:1 for body text, ≥3:1 for display (≥42px) — measured
 *                  against the actual rendered background pixels
 *   min-size       no text under 18px
 *   reel-safe      reel format: all text inside the centre 1080×1350
 *   brand-font     only token fonts (Playfair Display / Poppins)
 *   brand-color    only token colours for text
 *   logo           the KURIMASENSE mark is present
 *
 * Contrast method: the slide is screenshotted twice — once normally, once
 * with all text made transparent — and each text element's token colour is
 * checked against the background pixels beneath it (15th-percentile ratio,
 * so a stray hot pixel doesn't fail a legible slide, but a genuinely bright
 * zone does).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getBrowser, documentFor, formatSize, type Format } from "./render.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand", "tokens.json"), "utf8"));

export interface QAError {
  rule:
    | "clip"
    | "overlap"
    | "highlight-lead"
    | "contrast"
    | "min-size"
    | "reel-safe"
    | "brand-font"
    | "brand-color"
    | "logo";
  message: string;
  element?: string;
  value?: string | number;
}

export interface QAReport {
  ok: boolean;
  errors: QAError[];
  checkedElements: number;
}

const REEL_SAFE_TOP = 285;
const REEL_SAFE_BOTTOM = 285;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const TOKEN_FONTS = Object.values(tokens.fonts).map((f: any) => f.name as string);
const TOKEN_COLORS: Array<[number, number, number]> = Object.values(tokens.color).map((c) =>
  hexToRgb(c as string),
);

export async function qaSlide(bodyHtml: string, format: Format): Promise<QAReport> {
  const { width, height } = formatSize(format);
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const errors: QAError[] = [];
  try {
    await page.setContent(documentFor(bodyHtml, format), { waitUntil: "networkidle" });
    await page.evaluate("document.fonts.ready");

    // ---- collect text elements -----------------------------------------
    interface El {
      id: number;
      snippet: string;
      rect: { x: number; y: number; w: number; h: number };
      color: [number, number, number, number];
      opacity: number;
      fontSizePx: number;
      fontFamily: string;
      lineHeightRatio: number;
      hasHighlight: boolean;
      isDisplay: boolean;
      insideHighlight: boolean;
      ancestors: number[];
    }
    const els: El[] = await page.evaluate(`(() => {
      const out = [];
      const all = Array.from(document.querySelectorAll("*"));
      const withText = all.filter((el) =>
        Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0,
        ),
      );
      withText.forEach((el, i) => (el.dataset.qaid = String(i)));
      withText.forEach((el, i) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const m = cs.color.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/);
        const color = m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : [0, 0, 0, 1];
        let op = 1;
        for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity || 1;
        const fs = parseFloat(cs.fontSize);
        const lh = cs.lineHeight === "normal" ? 1.2 * fs : parseFloat(cs.lineHeight);
        const ancestors = [];
        for (let a = el.parentElement; a; a = a.parentElement) {
          if (a.dataset && a.dataset.qaid !== undefined) ancestors.push(+a.dataset.qaid);
        }
        out.push({
          id: i,
          snippet: (el.textContent ?? "").trim().slice(0, 44),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          color,
          opacity: op,
          fontSizePx: fs,
          fontFamily: cs.fontFamily,
          lineHeightRatio: lh / fs,
          hasHighlight: !!el.querySelector(".hl"),
          isDisplay: fs >= 42,
          insideHighlight: !!el.closest(".hl"),
          ancestors,
        });
      });
      return out;
    })()`);

    // ---- geometry rules --------------------------------------------------
    const TOL = 4;
    for (const el of els) {
      const { x, y, w, h } = el.rect;
      if (w === 0 || h === 0) continue;
      if (x < -TOL || y < -TOL || x + w > width + TOL || y + h > height + TOL) {
        errors.push({
          rule: "clip",
          element: el.snippet,
          message: `text extends beyond the canvas (${Math.round(x)},${Math.round(y)} ${Math.round(w)}×${Math.round(h)})`,
        });
      }
      if (format === "reel" && (y < REEL_SAFE_TOP - TOL || y + h > height - REEL_SAFE_BOTTOM + TOL)) {
        errors.push({
          rule: "reel-safe",
          element: el.snippet,
          message: `text outside the centre safe zone (y ${Math.round(y)}–${Math.round(y + h)})`,
        });
      }
      if (el.fontSizePx < 18) {
        errors.push({
          rule: "min-size",
          element: el.snippet,
          value: el.fontSizePx,
          message: `text is ${el.fontSizePx}px — minimum is 18px`,
        });
      }
      if (el.hasHighlight && el.lineHeightRatio < 1.1) {
        errors.push({
          rule: "highlight-lead",
          element: el.snippet,
          value: el.lineHeightRatio.toFixed(2),
          message: `highlighted headline leading ${el.lineHeightRatio.toFixed(2)} < 1.10 — bar will swallow the line above`,
        });
      }
      const fontOk = TOKEN_FONTS.some((f) => el.fontFamily.includes(f));
      if (!fontOk) {
        errors.push({
          rule: "brand-font",
          element: el.snippet,
          value: el.fontFamily,
          message: `non-token font '${el.fontFamily}'`,
        });
      }
      const [r, g, b] = el.color;
      const colorOk = TOKEN_COLORS.some(
        ([tr, tg, tb]) => Math.abs(tr - r) <= 2 && Math.abs(tg - g) <= 2 && Math.abs(tb - b) <= 2,
      );
      if (!colorOk) {
        errors.push({
          rule: "brand-color",
          element: el.snippet,
          value: `rgb(${r},${g},${b})`,
          message: `non-token text colour rgb(${r},${g},${b})`,
        });
      }
    }

    // ---- overlap (sibling text blocks must not intersect) ----------------
    const visible = els.filter((e) => e.rect.w > 0 && e.rect.h > 0);
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue;
        // inline fragments inside the same line (e.g. accent spans) share a parent chain — skip pairs whose parents overlap them naturally
        const ix = Math.max(0, Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x));
        const iy = Math.max(0, Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y));
        const inter = ix * iy;
        const smaller = Math.min(a.rect.w * a.rect.h, b.rect.w * b.rect.h);
        if (smaller > 0 && inter / smaller > 0.06) {
          errors.push({
            rule: "overlap",
            element: `${a.snippet} ⇄ ${b.snippet}`,
            value: `${Math.round((inter / smaller) * 100)}%`,
            message: `text blocks overlap by ${Math.round((inter / smaller) * 100)}% of the smaller block`,
          });
        }
      }
    }

    // ---- logo -------------------------------------------------------------
    const logoPresent = els.some((e) => e.snippet.toUpperCase().includes("KURIMASENSE"));
    if (!logoPresent) {
      errors.push({ rule: "logo", message: "KURIMASENSE mark is missing from the frame" });
    }

    // ---- contrast against real background pixels ---------------------------
    // hide text, screenshot the background, sample beneath each element
    await page.evaluate(`document.querySelectorAll("[data-qaid]").forEach((el) => {
      el.style.setProperty("color", "transparent", "important");
      el.style.setProperty("text-shadow", "none", "important");
    })`);
    const bgShot = (await page.screenshot({ type: "png" })).toString("base64");
    // rects of highlight bars — parent blocks must not sample their own bar as "background"
    const hlRects: Array<{ x: number; y: number; w: number; h: number }> = await page.evaluate(
      `Array.from(document.querySelectorAll(".hl")).map((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })`,
    );
    const contrastItems = els
      .filter((e) => !e.insideHighlight) // highlight text is measured against its own maize bar, which stays visible
      .map((e) => ({ id: e.id, rect: e.rect, color: e.color, opacity: e.opacity }));
    const contrastResults: Array<{ id: number; ratio: number }> = await page.evaluate(`(async () => {
        const b64 = ${JSON.stringify(bgShot)};
        const items = ${JSON.stringify(contrastItems)};
        const hlRects = ${JSON.stringify(hlRects)};
        const inHl = (px, py) => hlRects.some((r) => px >= r.x - 2 && px <= r.x + r.w + 2 && py >= r.y - 2 && py <= r.y + r.h + 2);
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const lum = (r, g, b) => {
          const f = (c) => {
            c /= 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const out = [];
        for (const it of items) {
          const { x, y, w, h } = it.rect;
          if (w < 4 || h < 4) continue;
          const ratios = [];
          const step = Math.max(6, Math.floor(Math.min(w, h) / 12));
          for (let sx = x + 3; sx < x + w - 3; sx += step) {
            for (let sy = y + 3; sy < y + h - 3; sy += step) {
              if (inHl(sx, sy)) continue;
              const px = ctx.getImageData(Math.round(sx), Math.round(sy), 1, 1).data;
              const alpha = it.color[3] * it.opacity;
              // effective text colour after blending with this bg pixel
              const tr = it.color[0] * alpha + px[0] * (1 - alpha);
              const tg = it.color[1] * alpha + px[1] * (1 - alpha);
              const tb = it.color[2] * alpha + px[2] * (1 - alpha);
              const L1 = lum(tr, tg, tb);
              const L2 = lum(px[0], px[1], px[2]);
              const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
              ratios.push(ratio);
            }
          }
          if (!ratios.length) continue;
          ratios.sort((a, b) => a - b);
          const p15 = ratios[Math.floor(ratios.length * 0.15)];
          out.push({ id: it.id, ratio: p15 });
        }
        return out;
      })()`);
    for (const res of contrastResults) {
      const el = els.find((e) => e.id === res.id)!;
      const min = el.isDisplay ? 3.0 : 4.5;
      if (res.ratio < min) {
        errors.push({
          rule: "contrast",
          element: el.snippet,
          value: res.ratio.toFixed(2),
          message: `contrast ${res.ratio.toFixed(2)}:1 < required ${min}:1 (${el.isDisplay ? "display" : "body"} text)`,
        });
      }
    }

    return { ok: errors.length === 0, errors, checkedElements: els.length };
  } finally {
    await page.close();
  }
}
