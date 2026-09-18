import type { FloodEvent, EvidenceRef } from "../models/contracts";
import extent2023 from "./geo/volta_flood_extent.json";
import extent2010 from "./geo/volta_flood_extent_2010.json";
import wv2018 from "./geo/wv_flood_extent_2018.json";
import wv2020 from "./geo/wv_flood_extent_2020.json";
import wv2024 from "./geo/wv_flood_extent_2024.json";
import cmFn2020 from "./geo/cm_fn2020.json";
import cmFn2024 from "./geo/cm_fn2024.json";
import cmYagoua2022 from "./geo/cm_yagoua2022.json";
import cmDla2020 from "./geo/cm_dla2020.json";
import cmDla2021 from "./geo/cm_dla2021.json";

const now = "2026-08-14T00:00:00Z";
const src = (sourceId: string, sourceName: string, evidenceState: EvidenceRef["evidenceState"], extra: Partial<EvidenceRef> = {}): EvidenceRef => ({ sourceId, sourceName, evidenceState, retrievedAt: now, ...extra });

export interface FloodStep { step: number; day: string; areaHa: number; geometry: GeoJSON.MultiPolygon }

function loadSteps(fc: GeoJSON.FeatureCollection): FloodStep[] {
  return fc.features
    .map((f) => ({ step: f.properties!.step as number, day: f.properties!.day as string, areaHa: f.properties!.areaHa as number, geometry: f.geometry as GeoJSON.MultiPolygon }))
    .sort((a, b) => a.step - b.step);
}

export const EXTENT_EVIDENCE: EvidenceRef = src("SRC-030", "Modeled floodplain (river-channel buffer)", "INFERRED", {
  confidence: 0.55, qualityFlags: { modeled: true, note: "Upgrade to Copernicus GFM/CEMS observed extent" },
});

export interface EventDef {
  id: string;
  regionId: string;
  label: string; // year shown in the switcher
  hasSpatial: boolean;
  steps: FloodStep[];
  captions: Record<number, string>;
  meta: FloodEvent;
}

export const EVENTS: Record<string, EventDef> = {
  "2010": {
    id: "2010", regionId: "lowerVolta", label: "2010", hasSpatial: true, steps: loadSteps(extent2010 as GeoJSON.FeatureCollection),
    captions: { 0: "2010 Akosombo controlled spillage begins", 2: "Lower Volta banks overtopped", 4: "Peak inundation (2010) — less severe than 2023", 5: "Waters begin to recede" },
    meta: {
      id: "GHA-2010-LOWERVOLTA", countryIso3: "GHA", name: "Lower Volta Floods 2010", mechanism: "dam-release",
      startTime: "2010-09-20", peakTime: "2010-10-18", endTime: "2010-10-30", river: "Volta",
      summary: "Controlled Akosombo spillage in 2010 flooded riverside Lower Volta communities — a smaller dam-release event than 2023.",
      externalIds: {}, sources: [src("SRC-006", "VRA (documented)", "REPORTED", { confidence: 0.5 })],
      impact: {},
    },
  },
  "2023": {
    id: "2023", regionId: "lowerVolta", label: "2023", hasSpatial: true, steps: loadSteps(extent2023 as GeoJSON.FeatureCollection),
    captions: { 0: "Controlled spillage begins at Akosombo & Kpong dams", 2: "Tongu lowlands begin to flood", 3: "Mepe & Battor inundated", 4: "Road links cut across North Tongu", 5: "Peak inundation — tens of thousands displaced", 6: "Waters begin to recede" },
    meta: {
      id: "GHA-2023-LOWERVOLTA", countryIso3: "GHA", name: "Lower Volta Dam Spillage 2023", mechanism: "dam-release",
      startTime: "2023-09-15", peakTime: "2023-10-15", endTime: "2023-10-25", river: "Volta",
      summary: "Controlled Akosombo & Kpong spillage inundated the Tongu districts and Ada estuary, displacing tens of thousands.",
      externalIds: { glide: "FL-2023-000179-GHA" },
      sources: [src("SRC-006", "VRA spillage releases", "REPORTED", { issuedAt: "2023-09-15" }), src("SRC-061", "IFRC GO", "REPORTED")],
      impact: { displaced: { value: 26000, unit: "persons", evidence: src("SRC-061", "IFRC GO / NADMO", "REPORTED", { confidence: 0.7 }) }, affected: { value: 43000, unit: "persons", evidence: src("SRC-060", "ReliefWeb / OCHA", "REPORTED", { confidence: 0.6 }) } },
    },
  },
  "wv2018": {
    id: "wv2018", regionId: "whiteVolta", label: "2018", hasSpatial: true, steps: loadSteps(wv2018 as GeoJSON.FeatureCollection),
    captions: { 0: "Bagre Dam (Burkina Faso) spillage begins", 2: "White Volta overtops across Upper East", 4: "Peak inundation — Bawku, Garu, Talensi", 5: "Waters begin to recede" },
    meta: {
      id: "GHA-2018-WHITEVOLTA", countryIso3: "GHA", name: "White Volta / Bagre Floods 2018", mechanism: "dam-release",
      startTime: "2018-08-25", peakTime: "2018-09-22", endTime: "2018-10-05", river: "White Volta",
      summary: "Burkina Faso's Bagre Dam release plus upstream rainfall flooded White Volta communities across the Upper East and North East regions.",
      externalIds: {}, sources: [src("SRC-006", "NADMO / press (documented)", "REPORTED", { confidence: 0.6 })],
      impact: {},
    },
  },
  "wv2020": {
    id: "wv2020", regionId: "whiteVolta", label: "2020", hasSpatial: true, steps: loadSteps(wv2020 as GeoJSON.FeatureCollection),
    captions: { 0: "2020 White Volta season rising", 2: "Riverside communities flooding", 4: "Peak inundation (2020)" },
    meta: {
      id: "GHA-2020-WHITEVOLTA", countryIso3: "GHA", name: "White Volta Floods 2020", mechanism: "riverine",
      startTime: "2020-09-20", peakTime: "2020-10-18", endTime: "2020-10-28", river: "White Volta",
      summary: "Seasonal White Volta riverine flooding across the Upper East region.",
      externalIds: {}, sources: [src("SRC-060", "NADMO (documented)", "REPORTED", { confidence: 0.5 })],
      impact: {},
    },
  },
  "wv2024": {
    id: "wv2024", regionId: "whiteVolta", label: "2024", hasSpatial: true, steps: loadSteps(wv2024 as GeoJSON.FeatureCollection),
    captions: { 0: "2024 White Volta season rising", 2: "Upper East lowlands flooding", 4: "Peak inundation (2024)" },
    meta: {
      id: "GHA-2024-WHITEVOLTA", countryIso3: "GHA", name: "Northern / White Volta Floods 2024", mechanism: "riverine",
      startTime: "2024-09-05", peakTime: "2024-09-26", endTime: "2024-10-10", river: "White Volta",
      summary: "Renewed White Volta / northern flooding across the Upper East and North East regions.",
      externalIds: {}, sources: [src("SRC-060", "ReliefWeb / NADMO (documented)", "REPORTED", { confidence: 0.5 })],
      impact: {},
    },
  },
  "cm_fn2020": {
    id: "cm_fn2020", regionId: "farNorth", label: "2020", hasSpatial: true, steps: loadSteps(cmFn2020 as GeoJSON.FeatureCollection),
    captions: { 0: "2020 Far North flooding begins along the Logone corridor", 2: "River overflow and floodplain inundation intensify", 3: "Kousséri and Waza floodplain communities affected", 5: "Peak inundation across the Far North" },
    meta: {
      id: "CMR-2020-FARNORTH", countryIso3: "CMR", name: "Far North September floods 2020", mechanism: "riverine",
      startTime: "2020-09-15", peakTime: "2020-09-25", endTime: "2020-10-01", river: "Logone",
      summary: "Heavy rainfall and Logone overflow inundated communities across the Far North, including Kousséri, Waza, and nearby floodplain settlements.",
      externalIds: { cems_activation: "EMSN082" }, sources: [src("CM-SRC-CEMS", "Copernicus EMS (EMSN082)", "OBSERVED", { confidence: 0.9 })],
      impact: { affected: { value: 100000, unit: "persons", evidence: src("CM-SRC-CHARTER", "Disasters Charter activation", "OBSERVED", { confidence: 0.82 }) } },
    },
  },
  "cm_fn2024": {
    id: "cm_fn2024", regionId: "farNorth", label: "2024", hasSpatial: true, steps: loadSteps(cmFn2024 as GeoJSON.FeatureCollection),
    captions: { 0: "2024 Far North wet season intensifies", 2: "Logone and tributary floodplain communities begin to flood", 4: "Peak inundation across Mayo-Danay and Logone-et-Chari", 5: "Floodwaters recede with major district impacts" },
    meta: {
      id: "CMR-2024-FARNORTH", countryIso3: "CMR", name: "Major Cameroon / Far North floods 2024", mechanism: "riverine",
      startTime: "2024-08-01", peakTime: "2024-09-20", endTime: "2024-11-30", river: "Logone",
      summary: "Large Far North inundation followed heavy rainfall and infrastructure stress, affecting Yagoua, Kousséri, Mayo-Danay and surrounding floodplain communities.",
      externalIds: { ifrc_operation: "MDRCM044", cems_activation: "EMSR779" }, sources: [src("SRC-061", "IFRC GO / emergency update", "REPORTED", { confidence: 0.76 })],
      impact: { affected: { value: 360000, unit: "persons", evidence: src("SRC-061", "IFRC GO / emergency update", "REPORTED", { confidence: 0.76 }) } },
    },
  },
  "cm_yagoua2022": {
    id: "cm_yagoua2022", regionId: "farNorth", label: "2022", hasSpatial: true, steps: loadSteps(cmYagoua2022 as GeoJSON.FeatureCollection),
    captions: { 0: "Yagoua flooding begins in October 2022", 1: "Streets and homes flooded in the town core", 2: "Peak inundation around Yagoua", 3: "Floodwater begins to drain" },
    meta: {
      id: "CMR-2022-YAGOUA", countryIso3: "CMR", name: "Yagoua flood 2022", mechanism: "riverine",
      startTime: "2022-10-07", peakTime: "2022-10-12", endTime: "2022-10-20", river: "Logone",
      summary: "Geotagged Wikimedia evidence confirms flooding in Yagoua during a seasonal riverine event in the Far North.",
      externalIds: {}, sources: [src("CM-SRC-WIKIMEDIA", "Wikimedia Commons / Yagoua flood photo set", "OBSERVED", { confidence: 0.56 })],
      impact: {},
    },
  },
  "cm_dla2020": {
    id: "cm_dla2020", regionId: "douala", label: "2020", hasSpatial: true, steps: loadSteps(cmDla2020 as GeoJSON.FeatureCollection),
    captions: { 0: "2020 Douala rainfall event begins", 1: "Flooded streets and low-lying suburbs", 2: "Peak urban inundation across Douala", 3: "Water recedes from the main urban corridors" },
    meta: {
      id: "CMR-2020-DOUALA", countryIso3: "CMR", name: "Douala flood 2020", mechanism: "urban-pluvial",
      startTime: "2020-08-01", peakTime: "2020-08-23", endTime: "2020-08-30", river: "Wouri",
      summary: "Heavy rainfall and drainage overload caused urban flooding across Douala and nearby low-lying neighborhoods.",
      externalIds: { charter_activation: "2020-west-cameroon" }, sources: [src("CM-SRC-CHARTER", "Disasters Charter activation", "OBSERVED", { confidence: 0.82 })],
      impact: { displaced: { value: 900, unit: "families", evidence: src("CM-SRC-CHARTER", "Disasters Charter activation", "OBSERVED", { confidence: 0.82 }) } },
    },
  },
  "cm_dla2021": {
    id: "cm_dla2021", regionId: "douala", label: "2021", hasSpatial: true, steps: loadSteps(cmDla2021 as GeoJSON.FeatureCollection),
    captions: { 0: "2021 Douala storm begins", 1: "main streets and ground-floor homes flood", 2: "Peak inundation with roads cut across the city", 3: "Water begins to recede" },
    meta: {
      id: "CMR-2021-DOUALA", countryIso3: "CMR", name: "Douala waist-deep urban flood 2021", mechanism: "urban-pluvial",
      startTime: "2021-08-11", peakTime: "2021-08-12", endTime: "2021-08-13", river: "Wouri",
      summary: "A heavy-rain event caused waist-deep flooding and road cuts across Douala, mainly in flood-prone lowland urban corridors.",
      externalIds: { report: "Reuters Douala 2021" }, sources: [src("CM-SRC-REUTERS", "Reuters Connect / Douala flood report", "REPORTED", { confidence: 0.5 })],
      impact: {},
    },
  },
};

export const DEFAULT_EVENT = "2023";
export const EVENT_IDS = Object.keys(EVENTS);
export function getEvent(id: string): EventDef {
  return EVENTS[id] ?? EVENTS[DEFAULT_EVENT];
}
export function eventsInRegion(regionId: string): EventDef[] {
  return EVENT_IDS.map((id) => EVENTS[id]).filter((e) => e.regionId === regionId).sort((a, b) => a.label.localeCompare(b.label));
}
