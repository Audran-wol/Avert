import { create } from "zustand";
import type { AlertDraft, AppNotification, SimulationRun } from "../domain/alertTypes";
import { reconcile } from "../domain/alertTypes";
import { createRun, stepRun, cancelRun as cancelRunEngine, retryFailed, fictionalRecipients, RECIPIENT_COUNT } from "../domain/simEngine";
import { usePreferencesStore } from "./preferencesStore";

const SCHEMA = "v1";
const DRAFTS_KEY = `avert.alerts.drafts.${SCHEMA}`;
const RUNS_KEY = `avert.alerts.runs.${SCHEMA}`;
const NOTIFS_KEY = `avert.notifications.${SCHEMA}`;

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function persist(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — in-memory state still works this session */ }
}

interface AlertsState {
  drafts: AlertDraft[];
  runs: SimulationRun[];
  notifications: AppNotification[];
  runningTimers: Record<string, boolean>; // guards duplicate step loops per run

  saveDraft: (d: AlertDraft) => void;
  deleteDraft: (id: string) => void;
  duplicateDraft: (id: string) => AlertDraft | undefined;

  startRun: (draft: AlertDraft) => SimulationRun;
  cancelRun: (runId: string) => void;
  retryRun: (runId: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt">) => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  drafts: load(DRAFTS_KEY, []),
  runs: load(RUNS_KEY, []),
  notifications: load(NOTIFS_KEY, []),
  runningTimers: {},

  saveDraft: (d) => {
    const drafts = get().drafts.some((x) => x.id === d.id) ? get().drafts.map((x) => (x.id === d.id ? d : x)) : [...get().drafts, d];
    set({ drafts }); persist(DRAFTS_KEY, drafts);
  },
  deleteDraft: (id) => { const drafts = get().drafts.filter((d) => d.id !== id); set({ drafts }); persist(DRAFTS_KEY, drafts); },
  duplicateDraft: (id) => {
    const src = get().drafts.find((d) => d.id === id);
    if (!src) return undefined;
    const copy: AlertDraft = { ...src, id: crypto.randomUUID(), reviewed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastRunId: undefined };
    const drafts = [...get().drafts, copy]; set({ drafts }); persist(DRAFTS_KEY, drafts);
    return copy;
  },

  startRun: (draft) => {
    const run = createRun({
      draftId: draft.id, draftSnapshotId: `${draft.id}@${draft.updatedAt}`, contextId: draft.contextId,
      communityId: draft.communityId, communityName: draft.communityName, regionName: draft.regionName,
      scenarioLabel: draft.scenarioLabel, message: draft.message, language: draft.language,
      recipientIds: fictionalRecipients().slice(0, draft.audienceCount || RECIPIENT_COUNT),
    });
    const runs = [...get().runs, run]; set({ runs }); persist(RUNS_KEY, runs);
    const updatedDraft = { ...draft, lastRunId: run.id }; get().saveDraft(updatedDraft);
    driveRun(run.id, get, set);
    return run;
  },

  cancelRun: (runId) => {
    const runs = get().runs.map((r) => (r.id === runId ? cancelRunEngine(r) : r));
    set({ runs }); persist(RUNS_KEY, runs);
  },

  retryRun: (runId) => {
    const runs = get().runs.map((r) => (r.id === runId ? retryFailed(r) : r));
    set({ runs }); persist(RUNS_KEY, runs);
    driveRun(runId, get, set);
  },

  pushNotification: (n) => {
    const notif: AppNotification = { ...n, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const notifications = [notif, ...get().notifications].slice(0, 200);
    set({ notifications }); persist(NOTIFS_KEY, notifications);
  },
  markRead: (id) => {
    const notifications = get().notifications.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n));
    set({ notifications }); persist(NOTIFS_KEY, notifications);
  },
  markAllRead: () => {
    const now = new Date().toISOString();
    const notifications = get().notifications.map((n) => (n.readAt ? n : { ...n, readAt: now }));
    set({ notifications }); persist(NOTIFS_KEY, notifications);
  },
}));

/** Batches a running simulation forward on a short interval until completion, then fires
 * exactly one completion notification. Idempotent per runId via `runningTimers`. */
function driveRun(runId: string, get: () => AlertsState, set: (partial: Partial<AlertsState>) => void) {
  if (get().runningTimers[runId]) return;
  set({ runningTimers: { ...get().runningTimers, [runId]: true } });

  const tick = () => {
    const current = get().runs.find((r) => r.id === runId);
    if (!current || current.status !== "running") { set({ runningTimers: { ...get().runningTimers, [runId]: false } }); return; }
    const next = stepRun(current);
    const runs = get().runs.map((r) => (r.id === runId ? next : r));
    set({ runs }); persist(RUNS_KEY, runs);
    if (next.status === "completed") {
      set({ runningTimers: { ...get().runningTimers, [runId]: false } });
      const counts = reconcile(next);
      const notifPrefs = usePreferencesStore.getState().preferences;
      if (notifPrefs.notifySimCompleted) get().pushNotification({ type: "simulation-completed", text: `Simulation for ${next.communityName} finished — ${counts.delivered} delivered, ${counts.failed} failed.`, runId });
      if (counts.failed > 0 && notifPrefs.notifySimFailures) get().pushNotification({ type: "simulation-failures", text: `${counts.failed} simulated failures in ${next.communityName}. Review the run.`, runId });
    } else {
      setTimeout(tick, 180);
    }
  };
  setTimeout(tick, 180);
}
