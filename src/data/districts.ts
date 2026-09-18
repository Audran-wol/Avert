import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import districtsGeo from "./geo/volta_districts.json";
import type { EvidenceRef, Valued } from "../models/contracts";

// Real Ghana ADM2 districts (geoBoundaries gbOpen, source: GSS / USAID, CC BY 4.0).
// Boundaries are REAL; district populations are official 2021 PHC control totals (approx).

const REGION: Record<string, string> = {
  "North Tongu": "Volta Region", "Central Tongu": "Volta Region", "South Tongu": "Volta Region",
  "Akatsi South": "Volta Region", "Akatsi North": "Volta Region", "Anloga": "Volta Region",
  "Keta Municipal": "Volta Region", "Ho West": "Volta Region", "Adaklu": "Volta Region",
  "Agotime Ziope": "Volta Region", "South Dayi": "Volta Region",
  "Ada East": "Greater Accra", "Ada West": "Greater Accra", "Shai Osudoku": "Greater Accra",
  "Ningo/prampram": "Greater Accra", "Ashaiman Municipal": "Greater Accra", "Kpone Katamanso": "Greater Accra",
  "Tema Metropolitan": "Greater Accra", "Tema West Municipal": "Greater Accra", "Adenta Municipal": "Greater Accra",
  "Ledzokuku Municipal": "Greater Accra", "Krowor Municipal": "Greater Accra",
  "Asuogyaman": "Eastern Region", "Upper Manya": "Eastern Region", "Lower Manya": "Eastern Region",
  "Yilo Krobo": "Eastern Region", "Okere": "Eastern Region", "Akwapem North": "Eastern Region",
};

// Official 2021 PHC district populations (approx, rounded) — REPORTED control totals.
const PHC_2021: Record<string, number> = {
  "North Tongu": 106000, "Central Tongu": 62000, "South Tongu": 93000,
  "Ada East": 72000, "Ada West": 69000, "Shai Osudoku": 64000, "Asuogyaman": 112000,
  "Anloga": 89000, "Keta Municipal": 112000, "Akatsi South": 100000, "Ningo/prampram": 148000,
  "South Dayi": 55000, "Ho West": 122000,
};

const now = "2026-08-14T00:00:00Z";
const censusEvidence = (name: string): EvidenceRef => ({
  sourceId: "SRC-007", sourceName: "Ghana Statistical Service · 2021 PHC", evidenceState: "REPORTED",
  retrievedAt: now, confidence: 0.85, qualityFlags: { approx: true, unit: `${name} district total` },
});

export interface District {
  name: string;
  region: string;
  population?: Valued;
  geometry: GeoJSON.Geometry;
}

export const DISTRICTS: District[] = (districtsGeo as GeoJSON.FeatureCollection).features.map((f) => {
  const name = f.properties!.name as string;
  const pop = PHC_2021[name];
  return {
    name,
    region: REGION[name] ?? "Volta Region",
    population: pop ? { value: pop, unit: "persons", evidence: censusEvidence(name) } : undefined,
    geometry: f.geometry,
  };
});

export const DISTRICTS_GEO = districtsGeo as GeoJSON.FeatureCollection;

export function districtOf(lng: number, lat: number): District | null {
  const p: GeoJSON.Feature<GeoJSON.Point> = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [lng, lat] } };
  for (const d of DISTRICTS) {
    if (booleanPointInPolygon(p, d.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon)) return d;
  }
  return null;
}
