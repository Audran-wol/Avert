import type { EvidenceRef } from "../models/contracts";
import { defaultRainSnapshot, getCachedRainSnapshot } from "../services/weather";

// Curated-real event drivers for the dam-release mechanism (Transition/03 §5, §9).
// Values are cited to their source with an evidence state; qualitative where the exact
// figure isn't openly published. This is the "why" behind the Lower Volta 2023 flood.

const now = "2026-08-14T00:00:00Z";
const ev = (sourceId: string, sourceName: string, state: EvidenceRef["evidenceState"], extra: Partial<EvidenceRef> = {}): EvidenceRef => ({
  sourceId, sourceName, evidenceState: state, retrievedAt: now, ...extra,
});

export interface Driver {
  id: string;
  label: string;
  value: string;
  detail: string;
  evidence: EvidenceRef;
  mode: "both" | "observed" | "forecast";
}

// The dam-release causal chain, top → bottom.
export const DRIVERS: Driver[] = [
  {
    id: "rainfall",
    label: "Basin rainfall",
    value: "Above normal",
    detail: "Sustained Sep 2023 rainfall over the Volta catchment raised inflows",
    evidence: ev("SRC-018", "CHIRPS / IMERG", "OBSERVED", { observedAt: "2023-09", confidence: 0.6, qualityFlags: { qualitative: true } }),
    mode: "both",
  },
  {
    id: "reservoir",
    label: "Akosombo reservoir",
    value: "≈ max operating level",
    detail: "Reservoir approached its ~278 ft maximum operating level, forcing controlled release",
    evidence: ev("SRC-006", "Volta River Authority", "REPORTED", { observedAt: "2023-09", confidence: 0.7 }),
    mode: "both",
  },
  {
    id: "spill",
    label: "Controlled spillage",
    value: "from 15 Sep 2023",
    detail: "Akosombo & Kpong spillways opened; escalated through October",
    evidence: ev("SRC-006", "Volta River Authority", "REPORTED", { issuedAt: "2023-09-15", confidence: 0.85 }),
    mode: "both",
  },
  {
    id: "discharge",
    label: "Lower Volta discharge",
    value: "Elevated",
    detail: "Downstream river discharge well above seasonal norms (global model)",
    evidence: ev("SRC-024", "GloFAS", "FORECAST", { issuedAt: "2023-10", confidence: 0.55, qualityFlags: { leadHours: 48, modeled: true } }),
    mode: "forecast",
  },
  {
    id: "inundation",
    label: "Floodplain inundation",
    value: "→ ≈99k ha peak",
    detail: "Modeled inundation of the Lower Volta floodplain (Tongu districts, Ada)",
    evidence: ev("SRC-030", "Modeled floodplain", "INFERRED", { confidence: 0.55, qualityFlags: { modeled: true } }),
    mode: "both",
  },
];

export const MECHANISM_NOTE = {
  observed: "Observed & reported drivers of the dam-release event.",
  forecast: "Forecast chain — GloFAS discharge carries ~48 h lead time on downstream stage.",
};

// Dynamic hazard as a FORECAST SCENARIO: how closely current conditions resemble the
// 2023 flood-driver pattern (Transition/11 §12 historical similarity). For the demo the
// scenario is set to "conditions resembling Oct 2023" so the pattern match is high.
export interface HazardMatch {
  label: string;
  matched: boolean;
  detail: string;
  evidence: EvidenceRef;
}
export function getForecastHazard(regionId: string = "lowerVolta") {
  const rain = getCachedRainSnapshot(regionId) ?? defaultRainSnapshot();
  const rainfallMatched = rain.rainPressure >= 0.55;
  const matches: HazardMatch[] = [
    { label: "Upstream reservoir near ceiling", matched: true, detail: "Akosombo / Bagre approaching release threshold", evidence: ev("SRC-006", "VRA / dam operators", "REPORTED", { confidence: 0.7 }) },
    {
      label: "Above-normal basin rainfall",
      matched: rainfallMatched,
      detail: `${rain.next72mm.toFixed(0)} mm in next 72h · ${rain.past7mm.toFixed(0)} mm in prior 7d`,
      evidence: ev("SRC-OPENMETEO", "Open-Meteo", "FORECAST", { issuedAt: rain.issuedAt, sourceUrl: "https://open-meteo.com/", confidence: 0.72, qualityFlags: { leadHours: 72, next72mm: rain.next72mm, past7mm: rain.past7mm, rainPressure: rain.rainPressure } }),
    },
    { label: "Elevated river discharge", matched: true, detail: "Downstream discharge remains elevated relative to seasonal norms", evidence: ev("SRC-024", "GloFAS", "FORECAST", { qualityFlags: { leadHours: 48 }, confidence: 0.55 }) },
  ];

  const matchedCount = matches.filter((m) => m.matched).length;
  const patternMatch = matchedCount / matches.length;
  const level = Math.min(100, Math.round(35 + rain.rainPressure * 65));

  return {
    scenario: "Historical flood pattern",
    level,
    leadHours: 48,
    confidence: 0.55,
    patternMatch,
    matches,
  };
}

export const FORECAST_HAZARD = getForecastHazard();
