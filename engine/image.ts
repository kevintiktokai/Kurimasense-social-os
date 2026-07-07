/**
 * image.ts — the background image layer.
 *
 * Generated backgrounds are ATMOSPHERE ONLY — the template owns all text.
 * A scene (assets/generated/scenes.json) is turned into a picture one of two
 * ways:
 *
 *   1. gpt-image-1, when OPENAI_API_KEY is set — the prompt is built from
 *      brand/art-direction.json (the house style) + the scene subject, with
 *      hard brand-safety constraints. Output is cached to
 *      assets/generated/<scene>.png so the same scene is byte-stable after the
 *      first generation (Law 2, deterministic-after-cache).
 *
 *   2. a deterministic on-palette placeholder SVG, when the key is absent —
 *      seeded entirely by the scene, so it is byte-identical every run.
 *
 * Brand safety is enforced in code, not just prose: assertBrandSafe() rejects
 * a scene whose subject smuggles in a face, a name, or a logo.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand", "tokens.json"), "utf8"));
const art = JSON.parse(readFileSync(join(root, "brand", "art-direction.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(root, "assets", "generated", "scenes.json"), "utf8"));

const GEN_DIR = join(root, "assets", "generated");

export interface Scene {
  id: string;
  subject: string;
  mood: string;
  tonality: "dark" | "mid" | "light";
  focalPoint: string;
  textZone: "upper" | "lower";
  goodFor: string[];
}

export function listScenes(): Scene[] {
  return registry.scenes;
}

export function getScene(id: string): Scene {
  const s = registry.scenes.find((s: Scene) => s.id === id);
  if (!s) throw new Error(`image: unknown scene '${id}'`);
  return s;
}

export function isScene(id: string): boolean {
  return registry.scenes.some((s: Scene) => s.id === id);
}

// ---------------------------------------------------------------- prompt --

/** Build the gpt-image-1 prompt from the house style + the scene. */
export function buildPrompt(scene: Scene): string {
  const s = art.style;
  return [
    `${s.medium}. ${scene.subject}.`,
    `Light: ${s.light}.`,
    `Palette: ${s.palette}.`,
    `Texture: ${s.texture}.`,
    `Lens & framing: ${s.lens}; ${s.composition}.`,
    `Mood: ${s.mood} — ${scene.mood}.`,
    `Setting: ${art.domain}.`,
    `Hard rules: ${art.constraints.join("; ")}.`,
  ].join(" ");
}

const BANNED = [
  /\bface(s)?\b/i,
  /\bportrait\b/i,
  /\blogo(s)?\b/i,
  /\bbrand(ed|s)?\b/i,
  /\bjohn deere\b/i,
  /\bcelebrit/i,
  /\bpresident\b/i,
  /\btext\b/i,
  /\bwatermark\b/i,
];

/** Reject a scene whose subject violates brand safety (Law: brand-safe imagery). */
export function assertBrandSafe(scene: Scene): void {
  // Neutralise negated safety clauses ("no faces", "without logos") so the
  // lint flags only affirmative requests for a face/logo/text/etc.
  const subject = scene.subject.replace(
    /\b(no|without)\s+(faces?|portraits?|logos?|text|watermarks?|brand\w*|people|person)\b/gi,
    "",
  );
  for (const re of BANNED) {
    if (re.test(subject)) {
      throw new Error(
        `image: scene '${scene.id}' subject violates brand safety (matched ${re}); imagery must be anonymous, text-free, logo-free`,
      );
    }
  }
}

// ----------------------------------------------------- deterministic placeholder

function hueSeed(id: string): number {
  const h = createHash("sha256").update(id).digest();
  return h[0] / 255;
}

/**
 * On-palette placeholder: a warm token-colour gradient chosen by tonality,
 * a soft sun glow at the scene's focal point, and seeded grain. Fully
 * deterministic from the scene id.
 */
export function placeholderSvg(scene: Scene): string {
  const c = tokens.color;
  const seed = hueSeed(scene.id);
  const ramp = {
    dark: [c.olive, "#33351F", c.ink],
    mid: [c.clay, c.earth, c.olive, c.ink],
    light: [c.clay, c.earth, "#6E6A4A", "#2A2A18"],
  }[scene.tonality];
  const [fx, fy] = scene.focalPoint.split(" ").map((v) => parseFloat(v));
  const angle = 150 + Math.round(seed * 40);
  const stops = ramp
    .map((col, i) => `<stop offset="${Math.round((i / (ramp.length - 1)) * 100)}%" stop-color="${col}"/>`)
    .join("");
  const glowOpacity = scene.tonality === "dark" ? 0.22 : 0.4;
  const grainSeed = tokens.texture.grainSeed + Math.round(seed * 20);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">${stops}</linearGradient>
    <radialGradient id="sun" cx="${fx}%" cy="${fy - 8}%" r="60%">
      <stop offset="0%" stop-color="${c.maizeBright}" stop-opacity="${glowOpacity}"/>
      <stop offset="45%" stop-color="${c.maize}" stop-opacity="${glowOpacity * 0.35}"/>
      <stop offset="100%" stop-color="${c.maize}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${grainSeed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="1080" height="1350" fill="url(#g)"/>
  <rect width="1080" height="1350" fill="url(#sun)"/>
  <rect width="1080" height="1350" filter="url(#grain)" opacity="0.10" style="mix-blend-mode:overlay"/>
</svg>`;
}

export function placeholderDataUri(scene: Scene): string {
  return `data:image/svg+xml;base64,${Buffer.from(placeholderSvg(scene)).toString("base64")}`;
}

// ---------------------------------------------------------------- resolve --

function cachedPngPath(id: string): string {
  return join(GEN_DIR, `${id}.png`);
}

/** Whether a real generated PNG has been baked for this scene. */
export function hasGenerated(id: string): boolean {
  return existsSync(cachedPngPath(id));
}

/**
 * Synchronous data URI for a scene, for use inside pure template rendering:
 * the cached gpt-image-1 PNG if present, otherwise the deterministic
 * placeholder. Never throws on a missing key — placeholder always works.
 */
export function sceneDataUri(id: string): string {
  const scene = getScene(id);
  if (hasGenerated(id)) {
    const buf = readFileSync(cachedPngPath(id));
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
  return placeholderDataUri(scene);
}

// ---------------------------------------------------------------- generate --

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function generatePng(scene: Scene): Promise<Buffer> {
  assertBrandSafe(scene);
  const prompt = buildPrompt(scene);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: art.generation.model,
      prompt,
      size: art.generation.size,
      quality: art.generation.quality,
      n: 1,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gpt-image-1 request failed (${res.status}): ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as { data: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("gpt-image-1 returned no image data");
  return Buffer.from(b64, "base64");
}

export interface EnsureResult {
  id: string;
  kind: "generated" | "cached" | "placeholder";
}

/**
 * Ensure a scene has a picture available for rendering.
 * - key set + not cached → generate and cache the PNG.
 * - key set + cached      → reuse cache (deterministic).
 * - no key                → placeholder mode (nothing to bake; sceneDataUri
 *   returns the deterministic placeholder at render time).
 */
export async function ensureScene(id: string, opts: { force?: boolean } = {}): Promise<EnsureResult> {
  const scene = getScene(id);
  assertBrandSafe(scene);
  if (!OPENAI_KEY) return { id, kind: "placeholder" };
  if (hasGenerated(id) && !opts.force) return { id, kind: "cached" };
  mkdirSync(GEN_DIR, { recursive: true });
  const png = await generatePng(scene);
  writeFileSync(cachedPngPath(id), png);
  return { id, kind: "generated" };
}

export async function ensureScenes(ids: string[], opts: { force?: boolean } = {}): Promise<EnsureResult[]> {
  const out: EnsureResult[] = [];
  for (const id of ids) out.push(await ensureScene(id, opts));
  return out;
}

export function hasApiKey(): boolean {
  return !!OPENAI_KEY;
}
