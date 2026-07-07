/**
 * intelligence.ts — typed access to the data bank and hook bank, with the
 * compliance laws enforced in code.
 *
 * - Every stat used in a brief must resolve to a data-bank id (Law 5).
 * - Every hook that ships must score >= the ship threshold.
 * - `context`-confidence datapoints may never be used as a headline stat.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export type Confidence = "high" | "medium" | "context";

export interface DataPoint {
  id: string;
  category: string;
  value: string;
  statement: string;
  source: string;
  year: number;
  confidence: Confidence;
}

export interface Hook {
  id: string;
  text: string;
  archetype: string;
  pillar: string;
  show: string;
  dataRef?: string;
  scores: Record<string, number>;
  score: number;
  status: "draft" | "live" | "retired";
  usedIn: string[];
  performance: {
    saves: number | null;
    shares: number | null;
    sends: number | null;
    rescored: string | null;
  };
}

const dataBank = JSON.parse(readFileSync(join(root, "intelligence", "data-bank.json"), "utf8"));
const hookBank = JSON.parse(readFileSync(join(root, "intelligence", "hooks.json"), "utf8"));

const SHIP_THRESHOLD: number = hookBank.meta.shipThreshold;

export function datapoints(): DataPoint[] {
  return dataBank.datapoints;
}

export function getDatapoint(id: string): DataPoint {
  const d = dataBank.datapoints.find((d: DataPoint) => d.id === id);
  if (!d) throw new Error(`data-bank: unknown datapoint id '${id}'`);
  return d;
}

export function hooks(): Hook[] {
  return hookBank.hooks;
}

export function getHook(id: string): Hook {
  const h = hookBank.hooks.find((h: Hook) => h.id === id);
  if (!h) throw new Error(`hooks: unknown hook id '${id}'`);
  return h;
}

/** Source line for a stat, ready for a case-study slide or first comment. */
export function citation(id: string): string {
  const d = getDatapoint(id);
  return `${d.source}, ${d.year}`;
}

/** A datapoint may headline only if it is not context-confidence. */
export function assertHeadlineUsable(id: string): DataPoint {
  const d = getDatapoint(id);
  if (d.confidence === "context") {
    throw new Error(
      `data-bank: '${id}' is context-confidence and may not be used as a headline stat (compliance §4)`,
    );
  }
  return d;
}

/** Recompute a hook's score from its axes. */
export function recomputeScore(h: Hook): number {
  return Object.values(h.scores).reduce((a, b) => a + b, 0);
}

/** Hooks that are live and above the ship threshold, best first. */
export function shippableHooks(): Hook[] {
  return hooks()
    .filter((h) => h.status === "live" && h.score >= SHIP_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

export interface IntegrityIssue {
  kind: "hook-score" | "hook-dataref" | "score-mismatch" | "dup-id";
  id: string;
  message: string;
}

/** Validate both banks against the laws. Used by the intelligence self-test. */
export function checkIntegrity(): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  const dpIds = new Set<string>();
  for (const d of datapoints()) {
    if (dpIds.has(d.id)) issues.push({ kind: "dup-id", id: d.id, message: `duplicate datapoint id` });
    dpIds.add(d.id);
  }

  const hookIds = new Set<string>();
  for (const h of hooks()) {
    if (hookIds.has(h.id)) issues.push({ kind: "dup-id", id: h.id, message: `duplicate hook id` });
    hookIds.add(h.id);

    const recomputed = recomputeScore(h);
    if (recomputed !== h.score) {
      issues.push({
        kind: "score-mismatch",
        id: h.id,
        message: `score ${h.score} != sum of axes ${recomputed}`,
      });
    }
    if (h.status === "live" && h.score < SHIP_THRESHOLD) {
      issues.push({
        kind: "hook-score",
        id: h.id,
        message: `live hook scores ${h.score} < ship threshold ${SHIP_THRESHOLD}`,
      });
    }
    if (h.dataRef && !dpIds.has(h.dataRef)) {
      issues.push({
        kind: "hook-dataref",
        id: h.id,
        message: `dataRef '${h.dataRef}' not in data bank`,
      });
    }
  }
  return issues;
}
