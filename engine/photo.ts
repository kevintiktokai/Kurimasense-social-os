/**
 * photo.ts — background image layer.
 *
 * A background is referenced by a single id that resolves to EITHER:
 *   - a curated library photo (assets/photos/photos.json), or
 *   - a generated scene (assets/generated/scenes.json → engine/image.ts:
 *     gpt-image-1 when a key is present, deterministic placeholder otherwise).
 *
 * Templates and briefs don't care which — they pass an id. The template owns
 * ALL text; images are atmosphere only. Each image is embedded as a data URI
 * (self-contained document), graded warm via a token-driven CSS filter, and
 * darkened with a token scrim chosen from tonality so maize type always has
 * contrast. Same id → same bytes in, same CSS out.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isScene, getScene, sceneDataUri } from "./image.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "assets", "photos", "photos.json"), "utf8"),
);

export interface Photo {
  id: string;
  file?: string;
  credit?: string;
  subject: string;
  mood: string;
  tonality: "dark" | "mid" | "light";
  focalPoint: string;
  textZone: "upper" | "lower";
  goodFor: string[];
  kind?: "library" | "generated";
}

export function listPhotos(): Photo[] {
  return manifest.photos;
}

/** Resolve id to background metadata, from the photo library OR the scene registry. */
export function getPhoto(id: string): Photo {
  const p = manifest.photos.find((p: Photo) => p.id === id);
  if (p) return { ...p, kind: "library" };
  if (isScene(id)) {
    const s = getScene(id);
    return {
      id: s.id,
      subject: s.subject,
      mood: s.mood,
      tonality: s.tonality,
      focalPoint: s.focalPoint,
      textZone: s.textZone,
      goodFor: s.goodFor,
      kind: "generated",
    };
  }
  const known = [
    ...manifest.photos.map((p: Photo) => p.id),
    ...["(scenes: run npm run scenes to list)"],
  ].join(", ");
  throw new Error(`Unknown background id '${id}'. Known library photos: ${known}`);
}

/** Data URI for a background id — library file or generated/placeholder scene. */
function backgroundDataUri(photo: Photo): string {
  if (photo.kind === "generated") return sceneDataUri(photo.id);
  const buf = readFileSync(join(root, "assets", "photos", photo.file!));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export type ScrimVariant = "default" | "strong" | "lower";

function scrimVar(photo: Photo, override?: ScrimVariant): string {
  const variant =
    override ??
    (photo.textZone === "lower"
      ? "lower"
      : photo.tonality === "light"
        ? "strong"
        : "default");
  return {
    default: "var(--grad-scrim-photo)",
    strong: "var(--grad-scrim-photo-strong)",
    lower: "var(--grad-scrim-photo-lower)",
  }[variant];
}

/**
 * Full-bleed photo + grade + scrim layers. Prepend inside the slide root
 * (which must be position:relative); text and frame layers go on top.
 */
export function photoLayers(
  photoId: string,
  opts: { scrim?: ScrimVariant; focalPoint?: string } = {},
): string {
  const photo = getPhoto(photoId);
  const focal = opts.focalPoint ?? photo.focalPoint;
  return `
  <img src="${backgroundDataUri(photo)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${focal};filter:var(--photo-filter);" alt=""/>
  <div style="position:absolute;inset:0;background:var(--photo-grade);"></div>
  <div style="position:absolute;inset:0;background:${scrimVar(photo, opts.scrim)};"></div>`;
}
