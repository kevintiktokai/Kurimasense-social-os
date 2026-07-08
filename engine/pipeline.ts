/**
 * pipeline.ts — Phase 7: orchestration with the human gate.
 *
 * The pipeline owns the brief lifecycle:
 *
 *   draft → review → approved | rejected → published
 *
 * Who may move what (Law 3 — approval is human-only):
 *   draft → review        machine, only via a green QA render (processDrafts)
 *   review → approved     human — npm run approve -- <id>
 *   review → rejected     human — npm run reject -- <id> <reason>, reason required
 *   rejected → draft      human — npm run rework -- <id>
 *   approved → published  reserved for the Phase 10 publish path; hard-blocked
 *                         until it exists. NEVER auto-publish.
 *
 * Every transition is appended to the brief's `history`, so the audit trail
 * is versioned in the brief file alongside the content it governs.
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadBrief, saveBrief, renderBrief, type Brief, type Transition } from "./brief.ts";
import { assertShippable, markHookUsed } from "./intelligence.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export type Status = Brief["status"];
export type Actor = Transition["by"];

/** status → { reachable status → actor allowed to make that move } */
const RULES: Record<Status, Partial<Record<Status, Actor>>> = {
  draft: { review: "machine" },
  review: { approved: "human", rejected: "human" },
  rejected: { draft: "human" },
  approved: { published: "machine" },
  published: {},
};

/** Mutate a brief through one lifecycle transition. Throws on anything illegal. */
export function applyTransition(brief: Brief, to: Status, by: Actor, reason?: string): Brief {
  const allowed = RULES[brief.status]?.[to];
  if (!allowed) {
    throw new Error(`pipeline: ${brief.id}: illegal transition ${brief.status} → ${to}`);
  }
  if (allowed !== by) {
    throw new Error(
      `pipeline: ${brief.id}: ${brief.status} → ${to} is reserved for ${allowed} (Law 3: approval is human-only)`,
    );
  }
  if (to === "rejected" && !reason?.trim()) {
    throw new Error(`pipeline: ${brief.id}: rejection requires a reason`);
  }
  if (to === "published") {
    throw new Error(
      `pipeline: ${brief.id}: no publish path exists yet (Phase 10). NEVER auto-publish.`,
    );
  }
  brief.history = [
    ...(brief.history ?? []),
    { at: new Date().toISOString(), from: brief.status, to, by, ...(reason ? { reason } : {}) },
  ];
  brief.status = to;
  return brief;
}

/** Every brief on disk, board order: review first, then draft, then the rest. */
export function listBriefs(): Brief[] {
  const order: Record<Status, number> = { review: 0, draft: 1, approved: 2, rejected: 3, published: 4 };
  return readdirSync(join(root, "briefs"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => loadBrief(f.replace(/\.json$/, "")))
    .sort((a, b) => order[a.status] - order[b.status] || a.id.localeCompare(b.id));
}

export interface PipelineRun {
  id: string;
  ok: boolean;
  notes: string[];
}

/**
 * The machine half of the loop: take every draft brief through the
 * intelligence gate (hook must be live and above the ship threshold) and the
 * hard QA render. Green → status review, hook marked used. Anything else
 * stays draft with the blocking errors reported. Never goes further:
 * review → approved belongs to the human.
 */
export async function processDrafts(): Promise<PipelineRun[]> {
  const runs: PipelineRun[] = [];
  for (const brief of listBriefs().filter((b) => b.status === "draft")) {
    try {
      assertShippable(brief.hook);
    } catch (e) {
      runs.push({ id: brief.id, ok: false, notes: [(e as Error).message] });
      continue;
    }
    const result = await renderBrief(brief);
    if (result.ok) {
      applyTransition(brief, "review", "machine", "QA green");
      saveBrief(brief);
      markHookUsed(brief.hook, brief.id);
      runs.push({ id: brief.id, ok: true, notes: [`review bundle: ${result.outDir}`] });
    } else {
      const notes = result.slides
        .filter((s) => !s.qa.ok)
        .flatMap((s) => s.qa.errors.map((e) => `${s.file} [${e.rule}] ${e.message}`));
      runs.push({ id: brief.id, ok: false, notes });
    }
  }
  return runs;
}

/** The human gate. Called only from the approve/reject/rework commands. */
export function decide(id: string, to: "approved" | "rejected" | "draft", reason?: string): Brief {
  const brief = loadBrief(id);
  applyTransition(brief, to, "human", reason);
  saveBrief(brief);
  return brief;
}
