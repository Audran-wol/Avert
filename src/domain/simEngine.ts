import type { Attempt, SimulationRun } from "./alertTypes";

// ponytail: mulberry32, ~6 lines, good enough for deterministic demo fixtures — not
// cryptographic, never used for anything security-sensitive.
function seededRandom(seed: number) {
  return function next() {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

export const RECIPIENT_COUNT = 120;
export function fictionalRecipients(): string[] {
  return Array.from({ length: RECIPIENT_COUNT }, (_, i) => `demo-recipient-${String(i + 1).padStart(3, "0")}`);
}

/** ~95% simulated-delivered, ~5% simulated-failed — deterministic per (seed, recipientId, attempt number). */
function outcomeFor(seed: string, recipientId: string, attemptNumber: number): { status: "simulated-delivered" | "simulated-failed"; reason?: Attempt["reason"] } {
  const rand = seededRandom(hashSeed(`${seed}:${recipientId}:${attemptNumber}`));
  const roll = rand();
  if (roll < 0.95) return { status: "simulated-delivered" };
  return { status: "simulated-failed", reason: roll < 0.975 ? "demo-timeout" : "demo-invalid-recipient" };
}

export function createRun(params: { draftId: string; draftSnapshotId: string; contextId: string; communityId: string; communityName: string; regionName: string; scenarioLabel: string; message: string; language: "en" | "fr"; recipientIds: string[] }): SimulationRun {
  return {
    id: crypto.randomUUID(),
    mode: "simulation",
    ...params,
    seed: crypto.randomUUID(),
    status: "running",
    attempts: params.recipientIds.map((recipientId) => ({ id: crypto.randomUUID(), recipientId, number: 1, status: "queued" as const })),
    startedAt: new Date().toISOString(),
  };
}

/**
 * Advances a running simulation by one batch, in place on a cloned run. Call repeatedly
 * (e.g. from a rAF/setTimeout loop) until status !== "running" for a visible progress fill
 * without blocking the main thread on 120 synchronous transitions.
 */
export function stepRun(run: SimulationRun, batchSize = 8): SimulationRun {
  if (run.status !== "running") return run;
  const attempts = run.attempts.map((a) => ({ ...a }));
  let advanced = 0;
  for (const a of attempts) {
    if (advanced >= batchSize) break;
    if (a.status === "queued") { a.status = "processing"; a.startedAt = new Date().toISOString(); advanced++; }
    else if (a.status === "processing") {
      const outcome = outcomeFor(run.seed, a.recipientId, a.number);
      a.status = outcome.status; a.reason = outcome.reason; a.finishedAt = new Date().toISOString();
      advanced++;
    }
  }
  const done = attempts.every((a) => a.status === "simulated-delivered" || a.status === "simulated-failed");
  return { ...run, attempts, status: done ? "completed" : "running", finishedAt: done ? new Date().toISOString() : undefined };
}

export function cancelRun(run: SimulationRun): SimulationRun {
  if (run.status !== "running") return run;
  const attempts = run.attempts.map((a) => (a.status === "queued" || a.status === "processing" ? { ...a, status: "cancelled" as const, finishedAt: new Date().toISOString() } : a));
  return { ...run, attempts, status: "cancelled", finishedAt: new Date().toISOString() };
}

/** New attempts for currently-failed recipients only. Preserves all prior attempt history. */
export function retryFailed(run: SimulationRun): SimulationRun {
  const maxByRecipient = new Map<string, number>();
  for (const a of run.attempts) maxByRecipient.set(a.recipientId, Math.max(maxByRecipient.get(a.recipientId) ?? 0, a.number));
  const latestByRecipient = new Map<string, Attempt>();
  for (const a of run.attempts) { const cur = latestByRecipient.get(a.recipientId); if (!cur || a.number > cur.number) latestByRecipient.set(a.recipientId, a); }

  const retryAttempts: Attempt[] = [];
  for (const [recipientId, latest] of latestByRecipient) {
    if (latest.status !== "simulated-failed") continue;
    retryAttempts.push({ id: crypto.randomUUID(), recipientId, number: (maxByRecipient.get(recipientId) ?? 0) + 1, status: "queued" });
  }
  if (retryAttempts.length === 0) return run;
  return { ...run, attempts: [...run.attempts, ...retryAttempts], status: "running", finishedAt: undefined };
}
