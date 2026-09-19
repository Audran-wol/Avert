import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";
import { computeStep, communityById } from "./exposure";
import { computeForecastRisk } from "./forecast";
import { SOURCES } from "../data/sources";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { AssessmentContext, ContextMetric, ContextSource } from "./askAvertTypes";

function sourceRef(sourceId: string, regionName: string): ContextSource {
  const s = SOURCES.find((x) => x.id === sourceId);
  return { id: sourceId, title: s?.name ?? sourceId, geographicScope: regionName, validAt: undefined, fetchedAt: undefined };
}

/** Immutable snapshot of the current selection — changes whenever region/event/mode/time/community change. */
export function buildAssessmentContext(): AssessmentContext {
  const s = useStore.getState();
  const event = getEvent(s.eventId);
  const region = getRegion(event.regionId);
  // Preferences > AI assistance > "Use selected community context": off means Ask Avert only
  // ever sees region-level context, never the selected community — not merely hidden from the UI.
  const useContext = usePreferencesStore.getState().preferences.aiUseContext;
  const community = useContext && s.selectedId ? communityById(s.selectedId) : undefined;
  const now = new Date().toISOString();

  const usedSourceIds = new Set<string>();
  const metrics: ContextMetric[] = [];
  const missingInputs: string[] = [];

  if (s.mode === "observed") {
    const { snapshots, priorities } = computeStep(s.eventId, s.stepIndex);
    const day = event.steps[s.stepIndex]?.day;
    if (community) {
      const snap = snapshots.get(community.id);
      const prio = priorities.find((p) => p.communityId === community.id);
      if (prio) {
        metrics.push({ key: "response_priority_score", value: prio.score, unit: "index 0-100", evidenceKind: "estimated", sourceIds: [] });
        metrics.push({ key: "response_priority_level", value: prio.level, evidenceKind: "estimated", sourceIds: [] });
      } else missingInputs.push("response_priority");
      if (snap?.populationExposed) {
        metrics.push({ key: "population_exposed", value: snap.populationExposed.value, unit: "people", range: snap.populationExposed.range, evidenceKind: "estimated", sourceIds: [snap.populationExposed.evidence.sourceId] });
        usedSourceIds.add(snap.populationExposed.evidence.sourceId);
      } else missingInputs.push("population_exposed");
      if (snap) {
        metrics.push({ key: "road_access", value: snap.roadStatus.value, evidenceKind: "modeled", sourceIds: [snap.roadStatus.evidence.sourceId] });
        usedSourceIds.add(snap.roadStatus.evidence.sourceId);
        metrics.push({ key: "flood_status", value: snap.floodStatus, evidenceKind: "modeled", sourceIds: [] });
      }
    } else {
      const inundated = [...snapshots.values()].filter((v) => v.floodStatus === "inundated").length;
      metrics.push({ key: "communities_inundated", value: inundated, evidenceKind: "modeled", sourceIds: [] });
    }
    metrics.push({ key: "scene_date", value: day ?? null, evidenceKind: "observed", sourceIds: [] });
  } else {
    if (community) {
      const risk = computeForecastRisk(community.id);
      if (risk) {
        metrics.push({ key: "next_flood_risk_index", value: risk.index, unit: "ordinal 0-100", evidenceKind: "modeled", sourceIds: [] });
        metrics.push({ key: "next_flood_risk_class", value: risk.class, evidenceKind: "modeled", sourceIds: [] });
        metrics.push({ key: "pattern_match", value: Math.round(risk.patternMatch * 100), unit: "%", evidenceKind: "modeled", sourceIds: [] });
      } else missingInputs.push("forecast_risk");
    }
  }

  for (const ev of event.meta.sources) usedSourceIds.add(ev.sourceId);

  const contextId = [s.mode, event.regionId, s.eventId, s.mode === "observed" ? s.stepIndex : "fc", s.selectedId ?? "region"].join("|");

  return {
    contextId,
    mode: s.mode === "observed" ? "history" : "forecast",
    regionId: region.id,
    regionName: region.name,
    communityId: community?.id,
    communityName: community?.name,
    eventId: s.eventId,
    eventName: event.meta.name,
    validAt: s.mode === "observed" ? (event.steps[s.stepIndex]?.day ?? event.meta.startTime) : now,
    generatedAt: now,
    method: { id: s.mode === "observed" ? "exposure-v1" : "forecast-risk-v1", label: s.mode === "observed" ? "Response priority model" : "Next-flood risk model" },
    metrics,
    sources: [...usedSourceIds].map((id) => sourceRef(id, region.name)),
    missingInputs,
    compareAvailable: s.mode === "observed" && event.steps.length > 1,
  };
}
