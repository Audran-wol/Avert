export type RecipientStatus = "queued" | "processing" | "simulated-delivered" | "simulated-failed" | "cancelled";
export type RunStatus = "running" | "completed" | "cancelled" | "interrupted";

export interface Attempt {
  id: string;
  recipientId: string;
  number: number;
  status: RecipientStatus;
  reason?: "demo-timeout" | "demo-invalid-recipient";
  startedAt?: string;
  finishedAt?: string;
}

export interface SimulationRun {
  id: string;
  mode: "simulation";
  draftId: string;
  draftSnapshotId: string; // draft revision this run was launched from
  contextId: string;
  communityId: string;
  communityName: string;
  regionName: string;
  scenarioLabel: string;
  message: string;
  language: "en" | "fr";
  recipientIds: string[];
  seed: string;
  status: RunStatus;
  attempts: Attempt[];
  startedAt: string;
  finishedAt?: string;
}

export interface AlertDraft {
  id: string;
  contextId: string;
  communityId: string;
  communityName: string;
  regionName: string;
  scenarioLabel: string;
  audienceCount: number;
  channel: "sms";
  language: "en" | "fr";
  message: string;
  reviewed: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunId?: string;
}

export type NotificationType = "draft-saved" | "simulation-completed" | "simulation-failures" | "data-error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  text: string;
  runId?: string;
  draftId?: string;
  createdAt: string;
  readAt?: string;
}

/** Current outcome per recipient = status of their highest-numbered attempt. */
export function recipientOutcomes(run: SimulationRun): Map<string, Attempt> {
  const byRecipient = new Map<string, Attempt>();
  for (const a of run.attempts) {
    const cur = byRecipient.get(a.recipientId);
    if (!cur || a.number > cur.number) byRecipient.set(a.recipientId, a);
  }
  return byRecipient;
}

export interface RunCounts { queued: number; processing: number; delivered: number; failed: number; cancelled: number }

export function reconcile(run: SimulationRun): RunCounts {
  const counts: RunCounts = { queued: 0, processing: 0, delivered: 0, failed: 0, cancelled: 0 };
  const outcomes = recipientOutcomes(run);
  for (const id of run.recipientIds) {
    const a = outcomes.get(id);
    const status = a?.status ?? "queued";
    if (status === "queued") counts.queued++;
    else if (status === "processing") counts.processing++;
    else if (status === "simulated-delivered") counts.delivered++;
    else if (status === "simulated-failed") counts.failed++;
    else if (status === "cancelled") counts.cancelled++;
  }
  return counts;
}
