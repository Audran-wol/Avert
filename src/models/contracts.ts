// FloodOps domain contracts — the frontend implementation of Transition/16_MVP_DATA_CONTRACTS.md.
// Every displayed value must carry an evidence state + provenance (Transition/11 §11, §3.2 doctrine).
// A real FastAPI/PostGIS backend would later serve these exact shapes; today they come from
// curated real data behind src/services/api.ts.

export type EvidenceState =
  | "OBSERVED" // sensor / field measurement
  | "FORECAST" // model prediction, has lead time
  | "INFERRED" // derived / segmented / modeled
  | "ASSESSED" // our index / exposure estimate
  | "REPORTED" // humanitarian / official narrative figure
  | "UNVERIFIED"; // unconfirmed field information

export type FloodMechanism =
  | "urban-pluvial"
  | "riverine"
  | "flash"
  | "dam-release"
  | "coastal"
  | "compound"
  | "unknown";

export interface EvidenceRef {
  sourceId: string; // e.g. SRC-028 (Copernicus GFM)
  sourceName?: string;
  sourceUrl?: string;
  evidenceState: EvidenceState;
  observedAt?: string;
  issuedAt?: string;
  validFrom?: string;
  validTo?: string;
  retrievedAt: string;
  confidence?: number; // 0..1
  qualityFlags?: Record<string, unknown>;
}

/** A value that always travels with its provenance. */
export interface Valued<T = number> {
  value: T;
  unit?: string;
  evidence: EvidenceRef;
}

export interface FloodEvent {
  id: string;
  countryIso3: "GHA" | "CMR";
  name: string;
  mechanism: FloodMechanism;
  startTime: string;
  peakTime?: string;
  endTime?: string;
  river?: string;
  summary: string;
  externalIds: Record<string, string>; // emdat/gdacs/glide/ifrc_go/cems_activation…
  sources: EvidenceRef[];
  photo?: {
    url: string;
    credit: string;
    sourceUrl: string;
    license: string;
    note?: string; // honesty caption, e.g. "representative, not this exact event"
  };
  impact: {
    displaced?: Valued;
    affected?: Valued;
    deaths?: Valued;
  };
}

export interface FloodFootprint {
  id: string;
  eventId: string;
  timestamp: string; // day of the inundation timeline
  method: "cems-gfm" | "cems-rapid" | "unosat" | "floodops-s1" | "field" | "modeled";
  areaHa: number;
  confidence: number;
  permanentWaterRemoved: boolean;
  advisories: { urban?: boolean; vegetation?: boolean; radarGeometry?: boolean };
  evidence: EvidenceRef;
  // geometry carried alongside as GeoJSON in the data layer (geometryUri in the real backend)
}

export interface Community {
  id: string;
  name: string;
  countryIso3: "GHA" | "CMR";
  admin1?: string; // region
  admin2?: string; // district
  lat: number;
  lng: number;
  population?: Valued;
}

export type FloodStatus = "inundated" | "partial" | "at-risk" | "safe";
export type DepthBand = "0-0.5m" | "0.5-1.5m" | "1.5-3m" | ">3m";
export type Isolation = "road-cut" | "restricted" | "accessible" | "unknown";

/** Per-community exposure at an event timestamp (Transition/16 §5, §6). */
export interface ExposureSnapshot {
  communityId: string;
  eventId: string;
  timestamp: string;
  floodStatus: FloodStatus;
  depthBand?: Valued<DepthBand>;
  populationExposed?: Valued & { range?: [number, number] };
  buildingsIntersected?: Valued;
  roadStatus: Valued<Isolation>;
  nearestShelterKm?: Valued;
  facilities?: { clinics?: number; schools?: number };
}

export type PriorityLevel = "monitor" | "priority" | "urgent" | "critical";

export interface PriorityFactor {
  code: string;
  contribution: number; // signed, for "why this priority"
  label: string;
  detail?: string;
  evidence?: EvidenceRef;
}

/** Explainable decision-support score — a blend, never a product (Transition/11 §13). */
export interface ResponsePriority {
  communityId: string;
  eventId: string;
  score: number; // 0..100 index, not a probability
  level: PriorityLevel;
  factors: PriorityFactor[];
  confidence: number; // 0..1
  modelVersion: string;
}

// Baseline susceptibility — "how flood-prone is this place, always?" (Transition/05, /16 §7).
// An interpretable INDEX (0..100), never a probability.
export type SuscClass = "low" | "moderate" | "high" | "very-high";
export interface BaselineSusceptibility {
  communityId: string;
  index: number;
  class: SuscClass;
  features: { handM: number; elevM: number; distRiverM: number; floodedBefore: boolean };
  evidence: EvidenceRef;
  modelVersion: string;
}
export function suscClass(i: number): SuscClass {
  if (i >= 70) return "very-high";
  if (i >= 50) return "high";
  if (i >= 30) return "moderate";
  return "low";
}
export const SUSC_COLOR: Record<SuscClass, string> = {
  low: "#31C48D", moderate: "#E3B341", high: "#F28A35", "very-high": "#EE4B4B",
};

// Forecast risk — "how likely/severe is flooding soon?" = susceptibility × dynamic hazard.
// Ordinal class, NEVER a probability until calibrated (Transition/11 §4).
export type RiskClass = "low" | "moderate" | "high" | "severe";
export function riskClass(i: number): RiskClass {
  if (i >= 75) return "severe";
  if (i >= 50) return "high";
  if (i >= 30) return "moderate";
  return "low";
}
export const RISK_CLASS_COLOR: Record<RiskClass, string> = {
  low: "#31C48D", moderate: "#E3B341", high: "#F28A35", severe: "#EE4B4B",
};
export interface ForecastRisk {
  communityId: string;
  index: number; // 0..100 ordinal index
  class: RiskClass;
  leadHours: number;
  patternMatch: number; // 0..1 similarity to the historical flood-driver pattern
  confidence: number;
  factors: PriorityFactor[];
  modelVersion: string;
}

export interface SourceStatus {
  sourceId: string;
  sourceName: string;
  status: "healthy" | "degraded" | "down" | "manual";
  lastSuccess?: string;
  stale: boolean;
  note?: string;
}

export const PRIORITY_COLOR: Record<PriorityLevel, string> = {
  monitor: "#31C48D",
  priority: "#E3B341",
  urgent: "#F28A35",
  critical: "#EE4B4B",
};

export function priorityLevel(score: number): PriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "urgent";
  if (score >= 40) return "priority";
  return "monitor";
}
