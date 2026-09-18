import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanIntersects from "@turf/boolean-intersects";
import pointToLineDistance from "@turf/point-to-line-distance";
import distance from "@turf/distance";
import { getEvent, EXTENT_EVIDENCE, EVENT_IDS } from "../data/flood";
import { getRegion, communityById as regionCommunityById, type Region } from "../data/regions";
import type {
  Community, ExposureSnapshot, ResponsePriority, DepthBand, Isolation, FloodStatus, EvidenceRef, PriorityFactor,
} from "../models/contracts";
import { priorityLevel } from "../models/contracts";

const pt = (c: Community): GeoJSON.Feature<GeoJSON.Point> => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [c.lng, c.lat] } });
const extentFeat = (eventId: string, i: number): GeoJSON.Feature<GeoJSON.MultiPolygon> => ({ type: "Feature", properties: {}, geometry: getEvent(eventId).steps[i].geometry });

// --- cheap bbox prefilter: Turf's polygon ops are O(coords); the WV road/extent sets are
// huge (771 roads × 14k-coord extents), so reject obvious non-matches by bbox first. ---
type BBox = [number, number, number, number];
function geomBBox(coords: unknown): BBox {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const walk = (a: unknown): void => {
    if (typeof (a as number[])[0] === "number") {
      const [x, y] = a as number[];
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
    } else for (const c of a as unknown[]) walk(c);
  };
  walk(coords);
  return [minx, miny, maxx, maxy];
}
const bboxOverlap = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const inBox = (b: BBox, lng: number, lat: number) => lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];
// cheap lower bound (metres) on point→geometry distance: distance to the geometry's bbox. Always
// ≤ the true distance, so if it already exceeds our best/cutoff we can skip the costly Turf call.
function boxLowerBoundM(b: BBox, lng: number, lat: number): number {
  const dxDeg = Math.max(0, b[0] - lng, lng - b[2]);
  const dyDeg = Math.max(0, b[1] - lat, lat - b[3]);
  return Math.hypot(dxDeg * 111320 * Math.cos((lat * Math.PI) / 180), dyDeg * 110540);
}

// Road-cut analysis only concerns the through-road network (the "primary road intersects flood
// extent" signal), so restrict it to classified major roads. This also drops unclassified tracks
// that roughly halve the Far North set (1447 → ~936), speeding every road pass proportionally.
const MAJOR_ROAD = new Set(["trunk", "primary", "secondary", "trunk_link", "primary_link", "secondary_link"]);
const roadClass = (f: GeoJSON.Feature): string | undefined => {
  const p = (f.properties ?? {}) as Record<string, string>;
  return p.highway ?? p.class ?? p.fclass ?? p.type;
};
const roadAnalysisCache = new Map<string, { features: GeoJSON.Feature<GeoJSON.LineString>[]; boxes: BBox[] }>();
function analysisRoads(region: Region): { features: GeoJSON.Feature<GeoJSON.LineString>[]; boxes: BBox[] } {
  if (!roadAnalysisCache.has(region.id)) {
    const all = region.roads.features as GeoJSON.Feature<GeoJSON.LineString>[];
    let features = all.filter((f) => MAJOR_ROAD.has(roadClass(f) ?? ""));
    if (features.length < 8) features = all; // region isn't classified — fall back to all roads
    roadAnalysisCache.set(region.id, { features, boxes: features.map((r) => geomBBox(r.geometry.coordinates)) });
  }
  return roadAnalysisCache.get(region.id)!;
}

// --- per-region precomputes (memoized) ---
const channelBoxCache = new Map<string, BBox[]>();
function channelBoxes(region: Region): BBox[] {
  if (!channelBoxCache.has(region.id))
    channelBoxCache.set(region.id, region.channelLines.map((l) => geomBBox(l.geometry.coordinates)));
  return channelBoxCache.get(region.id)!;
}
const distChannelCache = new Map<string, number[]>();
function distToChannel(region: Region): number[] {
  if (!distChannelCache.has(region.id)) {
    const lines = region.channelLines;
    const boxes = channelBoxes(region);
    // dch only feeds depthBand, whose deepest cutoff is 1800 m — beyond that the band is identical,
    // so cap the search at ~2 km and bbox-prune segments that can't beat the current best.
    distChannelCache.set(region.id, region.communities.map((c) => {
      let best = Infinity;
      for (let i = 0; i < lines.length; i++) {
        const lb = boxLowerBoundM(boxes[i], c.lng, c.lat);
        if (lb >= best || lb > 2000) continue;
        const d = pointToLineDistance([c.lng, c.lat], lines[i], { units: "meters" });
        if (d < best) best = d;
      }
      return best;
    }));
  }
  return distChannelCache.get(region.id)!;
}

const nearestRoadCache = new Map<string, { idx: number; distM: number }[]>();
function nearestRoads(region: Region): { idx: number; distM: number }[] {
  if (!nearestRoadCache.has(region.id)) {
    const { features: roads, boxes } = analysisRoads(region);
    // road-cut only matters within 3 km. bbox-prune every road that can't beat the current best or
    // is beyond ~3.3 km, and stop early once a road is essentially on top of the community.
    nearestRoadCache.set(region.id, region.communities.map((c) => {
      let idx = -1, best = Infinity;
      for (let i = 0; i < roads.length; i++) {
        const lb = boxLowerBoundM(boxes[i], c.lng, c.lat);
        if (lb >= best || lb > 3300) continue;
        const d = pointToLineDistance([c.lng, c.lat], roads[i] as GeoJSON.Feature<GeoJSON.LineString>, { units: "meters" });
        if (d < best) { best = d; idx = i; if (best < 50) break; }
      }
      return { idx, distM: best };
    }));
  }
  return nearestRoadCache.get(region.id)!;
}

const cutRoadsCache = new Map<string, Set<number>[]>();
function cutRoads(eventId: string): Set<number>[] {
  if (!cutRoadsCache.has(eventId)) {
    const region = getRegion(getEvent(eventId).regionId);
    const { features: roads, boxes } = analysisRoads(region);
    // A road-cut only ever affects a community via its NEAREST road within 3 km, so test just
    // those candidate roads against the extent — not all 771 (booleanIntersects is ~4 ms each).
    const candidates = [...new Set(nearestRoads(region).filter((x) => x.distM < 3000 && x.idx >= 0).map((x) => x.idx))];
    cutRoadsCache.set(eventId, getEvent(eventId).steps.map((_, s) => {
      const ext = extentFeat(eventId, s);
      const extBox = geomBBox(ext.geometry.coordinates);
      const cut = new Set<number>();
      for (const i of candidates) { if (bboxOverlap(boxes[i], extBox) && booleanIntersects(roads[i], ext)) cut.add(i); }
      return cut;
    }));
  }
  return cutRoadsCache.get(eventId)!;
}

// nearest-shelter distance is step-invariant: "shelter" = a community outside the PEAK extent,
// which is fixed per event. So compute the whole comms×shelters pass ONCE per event, not per step.
const shelterKmCache = new Map<string, (number | undefined)[]>();
function shelterKmFor(eventId: string): (number | undefined)[] {
  if (!shelterKmCache.has(eventId)) {
    const region = getRegion(getEvent(eventId).regionId);
    const comms = region.communities;
    const peak = extentFeat(eventId, getEvent(eventId).steps.length - 1);
    const peakBox = geomBBox(peak.geometry.coordinates);
    const shelters = comms.filter((c) => !(inBox(peakBox, c.lng, c.lat) && booleanPointInPolygon(pt(c), peak)));
    shelterKmCache.set(eventId, comms.map((c) => {
      let best = Infinity;
      for (const s of shelters) { const d = distance([c.lng, c.lat], [s.lng, s.lat], { units: "kilometers" }); if (d > 0.3 && d < best) best = d; }
      return Number.isFinite(best) ? +best.toFixed(1) : undefined;
    }));
  }
  return shelterKmCache.get(eventId)!;
}

function depthBand(distM: number): DepthBand {
  if (distM < 400) return ">3m";
  if (distM < 900) return "1.5-3m";
  if (distM < 1800) return "0.5-1.5m";
  return "0-0.5m";
}
const DEPTH_W: Record<DepthBand, number> = { ">3m": 25, "1.5-3m": 18, "0.5-1.5m": 10, "0-0.5m": 4 };
const ISO_W: Record<Isolation, number> = { "road-cut": 20, restricted: 10, accessible: 2, unknown: 5 };

interface StepResult { snapshots: Map<string, ExposureSnapshot>; priorities: ResponsePriority[] }
const cache = new Map<string, StepResult>();

export function computeStep(eventId: string, stepIndex: number): StepResult {
  const key = `${eventId}:${stepIndex}`;
  if (cache.has(key)) return cache.get(key)!;
  const region = getRegion(getEvent(eventId).regionId);
  const comms = region.communities;
  const steps = getEvent(eventId).steps;
  const ext = extentFeat(eventId, stepIndex);
  const peak = extentFeat(eventId, steps.length - 1);
  const extBox = geomBBox(ext.geometry.coordinates);
  const peakBox = geomBBox(peak.geometry.coordinates);
  const day = steps[stepIndex].day;
  const cutStep = cutRoads(eventId)[stepIndex];
  const nr = nearestRoads(region);
  const dch = distToChannel(region);

  // bbox-reject before the expensive polygon test: most communities sit far outside the extent.
  const status: FloodStatus[] = comms.map((c) =>
    inBox(extBox, c.lng, c.lat) && booleanPointInPolygon(pt(c), ext) ? "inundated"
      : inBox(peakBox, c.lng, c.lat) && booleanPointInPolygon(pt(c), peak) ? "at-risk" : "safe");
  const shelterKm = shelterKmFor(eventId); // memoized per event (step-invariant)

  const snapshots = new Map<string, ExposureSnapshot>();
  const priorities: ResponsePriority[] = [];

  comms.forEach((c, i) => {
    const st = status[i];
    const roadCut = nr[i].distM < 3000 && cutStep.has(nr[i].idx);
    const iso: Isolation = roadCut ? "road-cut" : st === "safe" ? "accessible" : "restricted";
    const pop = c.population?.value ?? 0;
    const frac = st === "inundated" ? 0.7 : st === "at-risk" ? 0.2 : 0;
    const exposed = Math.round(pop * frac);
    const range: [number, number] | undefined = st === "safe" ? undefined : [Math.round(pop * frac * 0.7), Math.round(pop * frac * 1.25)];
    const band = st === "safe" ? undefined : depthBand(dch[i]);
    const shelterKmI = shelterKm[i];

    const ev = (state: EvidenceRef["evidenceState"], name: string, conf: number): EvidenceRef => ({ sourceId: "SRC-052", sourceName: name, evidenceState: state, retrievedAt: EXTENT_EVIDENCE.retrievedAt, confidence: conf });

    snapshots.set(c.id, {
      communityId: c.id, eventId, timestamp: day, floodStatus: st,
      depthBand: band ? { value: band, evidence: { ...EXTENT_EVIDENCE } } : undefined,
      populationExposed: st === "safe" ? undefined : { value: exposed, unit: "persons", range, evidence: ev("ASSESSED", "WorldPop × flood extent", 0.5) },
      roadStatus: { value: iso, evidence: ev(roadCut ? "INFERRED" : "ASSESSED", "OSM roads × flood extent", roadCut ? 0.5 : 0.4) },
      nearestShelterKm: shelterKmI !== undefined ? { value: shelterKmI, unit: "km", evidence: ev("ASSESSED", "OSM settlements", 0.5) } : undefined,
    });

    const statusW = st === "inundated" ? 15 : st === "at-risk" ? 6 : 0;
    const popW = Math.min(exposed / 8000, 1) * 40;
    const depthW = band ? DEPTH_W[band] : 0;
    const isoW = ISO_W[iso];
    const score = Math.round(Math.min(100, statusW + popW + depthW + isoW));
    const factors: PriorityFactor[] = [];
    if (st !== "safe") factors.push({ code: "hazard", contribution: statusW, label: st === "inundated" ? "Inside flood extent" : "Within peak flood extent", evidence: EXTENT_EVIDENCE });
    if (exposed > 0) factors.push({ code: "population", contribution: Math.round(popW), label: `≈${(exposed / 1000).toFixed(1)}k people exposed`, detail: c.name });
    if (band && depthW >= 10) factors.push({ code: "depth", contribution: depthW, label: `Estimated depth ${band}` });
    if (roadCut) factors.push({ code: "isolation", contribution: isoW, label: "Primary road intersects flood extent" });

    priorities.push({ communityId: c.id, eventId, score, level: priorityLevel(score), factors, confidence: 0.55, modelVersion: "floodops-priority-0.1" });
  });

  priorities.sort((a, b) => b.score - a.score);
  const res = { snapshots, priorities };
  cache.set(key, res);
  return res;
}

export const communityById = regionCommunityById;

// Warm the heavy per-region/per-event Turf caches in the background (spread across idle slices)
// so the first Lower↔White switch is instant instead of a ~1.3 s main-thread block.
export function warmCaches(): void {
  const ric: (cb: () => void) => void =
    typeof requestIdleCallback === "function" ? (cb) => requestIdleCallback(cb) : (cb) => setTimeout(cb, 300);
  EVENT_IDS.forEach((id) => ric(() => { try { computeStep(id, getEvent(id).steps.length - 1); } catch { /* noop */ } }));
}
