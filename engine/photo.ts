/**
 * photo.ts — background photo layer.
 *
 * Photos come from the curated library in assets/photos/ (manifest:
 * photos.json). The template owns ALL text — photos are atmosphere only.
 * Each photo is embedded as a data URI (self-contained document), graded
 * warm via token-driven CSS filter, and darkened with a token scrim chosen
 * from the photo's tonality so maize-yellow type always has contrast.
 * Everything is deterministic: same photo id → same bytes in, same CSS out.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "assets", "photos", "photos.json"), "utf8"),
);

export interface Photo {
  id: string;
  file: string;
  credit: string;
  subject: string;
  mood: string;
  tonality: "dark" | "mid" | "light";
  focalPoint: string;
  textZone: "upper" | "lower";
  goodFor: string[];
}

export function listPhotos(): Photo[] {
  return manifest.photos;
}

export function getPhoto(id: string): Photo {
  const p = manifest.photos.find((p: Photo) => p.id === id);
  if (!p) {
    throw new Error(
      `Unknown photo id '${id}'. Known: ${manifest.photos.map((p: Photo) => p.id).join(", ")}`,
    );
  }
  return p;
}

function dataUri(file: string): string {
  const buf = readFileSync(join(root, "assets", "photos", file));
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
  <img src="${dataUri(photo.file)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${focal};filter:var(--photo-filter);" alt=""/>
  <div style="position:absolute;inset:0;background:var(--photo-grade);"></div>
  <div style="position:absolute;inset:0;background:${scrimVar(photo, opts.scrim)};"></div>`;
}
