import { describe, it, expect } from "vitest";
import { createRun, stepRun, cancelRun, retryFailed, fictionalRecipients } from "./simEngine";
import { reconcile } from "./alertTypes";

function runToCompletion(run: ReturnType<typeof createRun>) {
  let r = run;
  let guard = 0;
  while (r.status === "running" && guard++ < 1000) r = stepRun(r, 120);
  return r;
}

function baseRun() {
  return createRun({
    draftId: "d1", draftSnapshotId: "d1@1", contextId: "c1",
    communityId: "VOLO", communityName: "Volo", regionName: "Lower Volta", scenarioLabel: "Historical scenario",
    message: "AVERT DEMO: test", language: "en", recipientIds: fictionalRecipients(),
  });
}

describe("simEngine reconciliation", () => {
  it("recipient counts always sum to the total recipient count", () => {
    let r = baseRun();
    for (let i = 0; i < 5; i++) { r = stepRun(r); const c = reconcile(r); expect(c.queued + c.processing + c.delivered + c.failed + c.cancelled).toBe(r.recipientIds.length); }
    r = runToCompletion(r);
    const c = reconcile(r);
    expect(c.queued + c.processing + c.delivered + c.failed + c.cancelled).toBe(r.recipientIds.length);
    expect(r.status).toBe("completed");
  });

  it("is deterministic for the same seed", () => {
    const a = runToCompletion(baseRun());
    const b = runToCompletion({ ...baseRun(), seed: a.seed });
    const ca = reconcile(a), cb = reconcile(b);
    expect(cb.delivered).toBe(ca.delivered);
    expect(cb.failed).toBe(ca.failed);
  });
});

describe("cancellation", () => {
  it("cancels only pending work and preserves nothing already terminal", () => {
    let r = baseRun();
    r = stepRun(r); r = stepRun(r); // partially advance
    const cancelled = cancelRun(r);
    expect(cancelled.status).toBe("cancelled");
    const c = reconcile(cancelled);
    expect(c.queued).toBe(0);
    expect(c.processing).toBe(0);
    expect(c.queued + c.processing + c.delivered + c.failed + c.cancelled).toBe(r.recipientIds.length);
  });

  it("cancelling a completed run is a no-op", () => {
    const done = runToCompletion(baseRun());
    const again = cancelRun(done);
    expect(again).toBe(done);
  });
});

describe("retry accounting", () => {
  it("only retries currently-failed recipients, preserves original attempt history, never inflates unique recipient count", () => {
    let r = runToCompletion(baseRun());
    const before = reconcile(r);
    const originalAttemptCount = r.attempts.length;
    expect(originalAttemptCount).toBe(r.recipientIds.length);

    let retried = retryFailed(r);
    expect(retried.attempts.length).toBe(originalAttemptCount + before.failed);
    // original attempts (number 1) all still present, untouched
    const originalAttempts = retried.attempts.filter((a) => a.number === 1);
    expect(originalAttempts.length).toBe(originalAttemptCount);
    for (const a of originalAttempts) expect(["simulated-delivered", "simulated-failed"]).toContain(a.status);

    retried = runToCompletion(retried);
    const after = reconcile(retried);
    // unique recipients still equal the original count — retries don't create new recipients
    expect(after.queued + after.processing + after.delivered + after.failed + after.cancelled).toBe(r.recipientIds.length);
  });

  it("retrying with no failures is a no-op", () => {
    // force-construct a run where every recipient already delivered by retrying until 0 failures,
    // or simply assert retryFailed returns the same object when nothing is eligible.
    let r = runToCompletion(baseRun());
    while (reconcile(r).failed > 0) r = runToCompletion(retryFailed(r));
    const again = retryFailed(r);
    expect(again).toBe(r);
  });
});
