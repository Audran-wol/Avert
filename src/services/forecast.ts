import { susceptibilityFor } from "../data/features";
import { recurrenceForZone } from "../data/history";
import { getForecastHazard } from "../data/conditions";
import { getCachedRainSnapshot } from "./weather";
import type { Community, ForecastRisk, PriorityFactor } from "../models/contracts";
import { riskClass } from "../models/contracts";

// Forecast risk = baseline susceptibility (real, static) × dynamic hazard (current
// conditions from services/hazard — injectable with live data). Interpretable, ordinal.
// index = susceptibility × (0.4 + 0.6·hazard/100) — a blend, floored so hazard alone
// never zeroes a genuinely prone place (Transition/11 §13).
const cache = new Map<string, ForecastRisk | null>();

function regionOf(communityId: string) {
  if (communityId.startsWith("FN")) return "farNorth";
  if (communityId.startsWith("DL")) return "douala";
  if (communityId.startsWith("WV")) return "whiteVolta";
  if (communityId.startsWith("LV")) return "lowerVolta";
  return "lowerVolta";
}

export function computeForecastRisk(communityId: string): ForecastRisk | null {
  const regionId = regionOf(communityId);
  // recompute when the live rainfall snapshot changes
  const key = `${communityId}:${getCachedRainSnapshot(regionId)?.issuedAt ?? "0"}`;
  if (cache.has(key)) return cache.get(key)!;
  const s = susceptibilityFor(communityId);
  if (!s) { cache.set(key, null); return null; }

  const hz = getForecastHazard(regionId);
  const index = Math.round(Math.min(100, s.index * (0.4 + 0.6 * (hz.level / 100))));

  const factors: PriorityFactor[] = [];
  // multi-year historical recurrence for THIS community's basin (Transition/07)
  const zone = regionId === "farNorth" ? "Far North / Logone" : regionId === "douala" ? "Douala" : regionId === "whiteVolta" ? "White Volta" : "Lower Volta";
  const rec = recurrenceForZone(zone);
  const recEv = rec.years.length
    ? { sourceId: "SRC-058", sourceName: `Flood record (${rec.count}× since 2007)`, evidenceState: "REPORTED" as const, retrievedAt: "2026-08-14T00:00:00Z", confidence: 0.55 }
    : undefined;
  const recContribution = Math.min(28, rec.count * 6 + (s.features.floodedBefore ? 6 : 0));
  if (recContribution > 0)
    factors.push({ code: "recurrence", contribution: recContribution, label: `${zone} flooded ${rec.count}× in the record`, detail: `Flood years: ${rec.years.join(", ")}`, evidence: recEv });
  factors.push({ code: "terrain", contribution: s.features.handM < 5 ? 20 : s.features.handM < 10 ? 12 : 5, label: `Low-lying floodplain · HAND ${s.features.handM} m`, detail: `${s.features.distRiverM} m from the channel`, evidence: s.evidence });
  // current dynamic-hazard conditions (rainfall may be live from Open-Meteo)
  for (const m of hz.matches) {
    if (m.matched) factors.push({ code: "match", contribution: 12, label: m.label, detail: m.detail, evidence: m.evidence });
  }

  const risk: ForecastRisk = {
    communityId, index, class: riskClass(index),
    leadHours: hz.leadHours, patternMatch: hz.patternMatch,
    confidence: +(0.5 * s.evidence.confidence! + 0.5 * hz.confidence).toFixed(2),
    factors, modelVersion: "floodops-forecast-0.2",
  };
  cache.set(key, risk);
  return risk;
}

export function forecastRanking(communities: Community[]): ForecastRisk[] {
  return communities.map((c) => computeForecastRisk(c.id)).filter((r): r is ForecastRisk => !!r).sort((a, b) => b.index - a.index);
}
