/**
 * decide.ts — THE human gate (Law 3). These commands are for the human
 * reviewer only; nothing else in the system may call them.
 *
 *   npm run approve -- <brief-id>            review → approved
 *   npm run reject  -- <brief-id> <reason>   review → rejected (reason required)
 *   npm run rework  -- <brief-id>            rejected → draft, for another pass
 *
 * Approval queues nothing: publishing is Phase 10 and NEVER automatic.
 */
import { decide } from "../engine/pipeline.ts";

const [, , cmd, id, ...rest] = process.argv;
const reason = rest.join(" ").trim() || undefined;

const TO = { approve: "approved", reject: "rejected", rework: "draft" } as const;

if (!id || !(cmd in TO)) {
  console.error("usage: npm run approve|reject|rework -- <brief-id> [reason]");
  process.exit(2);
}

const brief = decide(id, TO[cmd as keyof typeof TO], reason);

console.log(`${brief.id}: status → ${brief.status}${reason ? ` (${reason})` : ""}`);
if (brief.status === "approved") {
  console.log("Approved. Nothing is queued — publishing arrives in Phase 10 and is never automatic.");
} else if (brief.status === "rejected") {
  console.log("Rejected. Run `npm run rework -- " + brief.id + "` to send it back to draft for another pass.");
} else {
  console.log("Back to draft. Edit the brief, then `npm run pipeline` takes it through QA again.");
}
