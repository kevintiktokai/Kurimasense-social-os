/**
 * trends.ts — Phase 8: what is timely, deterministically.
 *
 * Two kinds of trend (intelligence/trends.json):
 * - `seasonal` — the fixed Zimbabwean agricultural calendar. Month windows,
 *   never expire, always true for their season. The planner leans on these.
 * - `topics` — live researched items added by the Sunday research routine.
 *   A topic MUST carry a source and an expiry (Law 5: an unsourced trend is
 *   a fabricated trend). Expired topics stop surfacing automatically.
 *
 * Everything here is a pure function of the bank + the ISO week asked about:
 * same banks, same week → same answer (Law 2).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface SeasonalWindow {
  id: string;
  name: string;
  months: number[];
  note: string;
  shows: string[];
}

export interface Topic {
  id: string;
  headline: string;
  note: string;
  source: string;
  observed: string;
  expires: string;
  shows: string[];
  status: "live" | "expired";
}

const bank = JSON.parse(readFileSync(join(root, "intelligence", "trends.json"), "utf8"));

export function trendsUpdated(): string {
  return bank.meta.updated;
}

export function seasonalWindows(): SeasonalWindow[] {
  return bank.seasonal;
}

export function topics(): Topic[] {
  return bank.topics;
}

/** ISO week (Mon-based, week 1 contains 4 Jan) of a date. */
export function isoWeekOf(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day); // the Thursday decides the ISO year
  const year = t.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.ceil(((t.getTime() - jan1) / 86400000 + 1) / 7);
  return { year, week };
}

/** UTC Monday of an ISO week. */
export function mondayOf(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (day - 1) + (week - 1) * 7);
  return monday;
}

/** Calendar months (1–12) the ISO week touches — usually one, two at a boundary. */
export function monthsOfWeek(year: number, week: number): number[] {
  const monday = mondayOf(year, week);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const months = [monday.getUTCMonth() + 1];
  if (sunday.getUTCMonth() !== monday.getUTCMonth()) months.push(sunday.getUTCMonth() + 1);
  return months;
}

/** Seasonal windows active in an ISO week, bank order preserved. */
export function activeSeasonal(year: number, week: number): SeasonalWindow[] {
  const months = monthsOfWeek(year, week);
  return seasonalWindows().filter((s) => s.months.some((m) => months.includes(m)));
}

/** Live topics that have not expired by the Monday of the given week. */
export function activeTopics(year: number, week: number): Topic[] {
  const monday = mondayOf(year, week).toISOString().slice(0, 10);
  return topics().filter((t) => t.status === "live" && t.expires >= monday);
}

export interface TrendIssue {
  id: string;
  message: string;
}

/** Validate the trends bank against its laws. Used by npm run intel. */
export function checkTrendsIntegrity(): TrendIssue[] {
  const issues: TrendIssue[] = [];
  const ids = new Set<string>();
  for (const s of seasonalWindows()) {
    if (ids.has(s.id)) issues.push({ id: s.id, message: "duplicate trend id" });
    ids.add(s.id);
    if (!s.months?.length || s.months.some((m) => m < 1 || m > 12)) {
      issues.push({ id: s.id, message: "seasonal window needs months in 1–12" });
    }
    if (!s.note?.trim()) issues.push({ id: s.id, message: "seasonal window missing note" });
  }
  for (const t of topics()) {
    if (ids.has(t.id)) issues.push({ id: t.id, message: "duplicate trend id" });
    ids.add(t.id);
    if (!t.source?.trim()) issues.push({ id: t.id, message: "topic has no source (Law 5)" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.expires ?? "")) {
      issues.push({ id: t.id, message: "topic needs an expires date (YYYY-MM-DD)" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.observed ?? "")) {
      issues.push({ id: t.id, message: "topic needs an observed date (YYYY-MM-DD)" });
    }
  }
  return issues;
}
