/**
 * markup.ts — inline copy markup.
 *
 *   *word*   → display-serif italic accent (reference style: "Habit 01" italics)
 *   ==word== → maize highlight bar with ink text
 *
 * Templates own all type; briefs carry plain strings with this markup.
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function inline(text: string): string {
  return esc(text)
    .replace(/==([^=]+)==/g, `<span class="hl">$1</span>`)
    .replace(/\*([^*]+)\*/g, `<span class="accent">$1</span>`)
    .replace(/\n/g, "<br/>");
}

/** Strip markup for measurement/QA purposes. */
export function plain(text: string): string {
  return text.replace(/==([^=]+)==/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

/**
 * Deterministic display sizing: long headlines step down so copy length
 * can't clip the frame. Same text → same size.
 */
export function fitDisplay(text: string, basePx: number, minPx = 64): number {
  const n = plain(text).replace(/\n/g, " ").length;
  let size = basePx;
  if (n > 40) size = Math.round(basePx * 0.88);
  if (n > 60) size = Math.round(basePx * 0.78);
  if (n > 80) size = Math.round(basePx * 0.7);
  if (n > 100) size = Math.round(basePx * 0.62);
  return Math.max(minPx, size);
}
