// Shared shape between the client (src/services/askAvert.ts) and the server-side handler
// (server/askAvert.ts). Pure types/interfaces only — safe to import from either side.

export type EvidenceKind = "observed" | "reported" | "estimated" | "modeled";

export interface ContextMetric {
  key: string;
  value: number | string | null;
  unit?: string;
  range?: [number, number];
  evidenceKind: EvidenceKind;
  sourceIds: string[];
}

export interface ContextSource {
  id: string;
  title: string;
  sourceUrl?: string;
  validAt?: string;
  fetchedAt?: string;
  geographicScope: string;
}

export interface AssessmentContext {
  contextId: string;
  mode: "history" | "forecast";
  regionId: string;
  regionName: string;
  communityId?: string;
  communityName?: string;
  eventId?: string;
  eventName?: string;
  validAt: string;
  generatedAt: string;
  method: { id: string; label: string; version?: string };
  metrics: ContextMetric[];
  sources: ContextSource[];
  missingInputs: string[];
  compareAvailable: boolean;
}

export type AllowlistedAction =
  | { type: "open_source"; sourceId: string }
  | { type: "highlight_feature"; communityId: string }
  | { type: "compare_available_dates" }
  | { type: "prepare_alert_draft" };

export interface AskAvertRequestBody {
  message: string;
  context: AssessmentContext;
}

export interface AskAvertResponseBody {
  answer: string;
  sourceIds: string[];
  missingNotes: string[];
  actions: AllowlistedAction[];
  example?: boolean;
}
