/**
 * pipeline-selftest.ts — prove the lifecycle rules in code, in memory.
 *
 *   npm run pipeline:test
 *
 * Legal moves must succeed and be recorded in history; every path that
 * would let the machine approve or anything publish must throw.
 */
import { applyTransition } from "../engine/pipeline.ts";
import { assertShippable } from "../engine/intelligence.ts";
import type { Brief } from "../engine/brief.ts";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}: ${(e as Error).message}`);
    failures++;
  }
}

function mustThrow(name: string, fn: () => void): void {
  check(name, () => {
    try {
      fn();
    } catch {
      return;
    }
    throw new Error("expected this to throw, it did not");
  });
}

function fixture(status: Brief["status"]): Brief {
  return {
    id: "selftest",
    created: "2026-07-08",
    pillar: "field-intelligence",
    show: "The Playbook",
    hook: "hook-thirsty-two-weeks",
    format: "carousel",
    slides: [],
    caption: "",
    first_comment: "",
    hashtags: [],
    rationale: "selftest",
    status,
  };
}

// Legal path, machine half
check("draft → review by machine", () => {
  const b = applyTransition(fixture("draft"), "review", "machine", "QA green");
  if (b.status !== "review") throw new Error(`status is ${b.status}`);
  if (b.history?.at(-1)?.reason !== "QA green") throw new Error("history not recorded");
});

// Legal path, human gate
check("review → approved by human", () => {
  if (applyTransition(fixture("review"), "approved", "human").status !== "approved") throw new Error("not approved");
});
check("review → rejected by human with reason", () => {
  if (applyTransition(fixture("review"), "rejected", "human", "off-voice").status !== "rejected") throw new Error("not rejected");
});
check("rejected → draft by human (rework)", () => {
  if (applyTransition(fixture("rejected"), "draft", "human").status !== "draft") throw new Error("not draft");
});

// Law 3 — approval is human-only, and nothing publishes
mustThrow("review → approved by machine is blocked", () =>
  applyTransition(fixture("review"), "approved", "machine"),
);
mustThrow("review → rejected without a reason is blocked", () =>
  applyTransition(fixture("review"), "rejected", "human"),
);
mustThrow("draft → approved (skipping review) is blocked", () =>
  applyTransition(fixture("draft"), "approved", "human"),
);
mustThrow("draft → review by human (skipping QA) is blocked", () =>
  applyTransition(fixture("draft"), "review", "human"),
);
mustThrow("approved → published is blocked until Phase 10", () =>
  applyTransition(fixture("approved"), "published", "machine"),
);
mustThrow("published brief cannot move", () =>
  applyTransition(fixture("published"), "draft", "human"),
);

// Intelligence gate
check("shippable hook resolves", () => void assertShippable("hook-thirsty-two-weeks"));
mustThrow("unknown hook id is blocked", () => assertShippable("hook-does-not-exist"));

if (failures > 0) {
  console.error(`\n${failures} pipeline self-test failure(s).`);
  process.exit(1);
}
console.log("\nPipeline self-test green.");
