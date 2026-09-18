import lvFeatures from "./geo/volta_features.json";
import wvFeatures from "./geo/wv_features.json";
import fnFeatures from "./geo/cm_farnorth_features.json";
import dlFeatures from "./geo/cm_douala_features.json";
import type { BaselineSusceptibility, EvidenceRef } from "../models/contracts";
import { suscClass } from "../models/contracts";

// Real terrain features per Ghana and Cameroon communities (SRTM 30m via OpenTopoData). Array order
// matches the region community arrays → id = <PREFIX>-{index}.
interface RawFeature { name: string; elevM: number; handM: number; distRiverM: number; flooded2023: boolean; susceptibility: number; }

const demEvidence: EvidenceRef = {
  sourceId: "SRC-038", sourceName: "SRTM 30m · OpenTopoData", evidenceState: "INFERRED",
  retrievedAt: "2026-08-14T00:00:00Z", confidence: 0.6, qualityFlags: { handApprox: true },
};

const byId = new Map<string, BaselineSusceptibility>();
function load(features: RawFeature[], prefix: string) {
  features.forEach((f, i) => {
    const id = `${prefix}-${String(i).padStart(3, "0")}`;
    byId.set(id, {
      communityId: id,
      index: f.susceptibility,
      class: suscClass(f.susceptibility),
      features: { handM: f.handM, elevM: f.elevM, distRiverM: f.distRiverM, floodedBefore: f.flooded2023 },
      evidence: demEvidence,
      modelVersion: "floodops-susceptibility-0.1",
    });
  });
}
load(lvFeatures as RawFeature[], "LV");
load(wvFeatures as RawFeature[], "WV");
load(fnFeatures as RawFeature[], "FN");
load(dlFeatures as RawFeature[], "DL");

export function susceptibilityFor(communityId: string): BaselineSusceptibility | undefined {
  return byId.get(communityId);
}
