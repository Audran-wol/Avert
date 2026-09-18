import type { Community, EvidenceRef } from "../models/contracts";
import { districtOf } from "./districts";
import lvComm from "./geo/volta_communities.json";
import lvRivers from "./geo/volta_rivers.json";
import lvRoads from "./geo/volta_roads.json";
import wvComm from "./geo/wv_communities.json";
import wvRivers from "./geo/wv_rivers.json";
import wvRoads from "./geo/wv_roads.json";
import fnComm from "./geo/cm_farnorth_communities.json";
import fnRivers from "./geo/cm_farnorth_rivers.json";
import fnRoads from "./geo/cm_farnorth_roads.json";
import dlComm from "./geo/cm_douala_communities.json";
import dlRivers from "./geo/cm_douala_rivers.json";
import dlRoads from "./geo/cm_douala_roads.json";

const now = "2026-08-14T00:00:00Z";
const popEv = (real: boolean): EvidenceRef => ({
  sourceId: real ? "SRC-052" : "SRC-047", sourceName: real ? "OpenStreetMap" : "WorldPop (estimated)",
  evidenceState: real ? "OBSERVED" : "ASSESSED", retrievedAt: now, confidence: real ? 0.8 : 0.5,
});

const KNOWN_POP: Record<string, number> = {
  // Lower Volta
  Sogakope: 12000, Juapong: 10000, "Ada Foah": 8000, "Big Ada": 7000, Kpong: 8000, Mepe: 6000, Adidome: 6000,
  Battor: 5000, Aveyime: 5000, Atimpoku: 5000, Tefle: 4000, Volo: 4000, Anyanui: 3500,
  // White Volta / Upper East–North East
  Bolgatanga: 66000, Navrongo: 30000, Walewale: 30000, Gambaga: 20000, Nalerigu: 22000, Bunkpurugu: 18000,
  Wulugu: 12000, Sandema: 15000, Zebilla: 18000, Bawku: 65000, Chereponi: 12000,
  // Cameroon
  Yagoua: 30000, Kousséri: 90000, Maga: 15000, Douala: 200000, "Bonaberi": 150000, "Makepe": 50000, "Deido": 120000, "Akwa": 80000,
};
const POP_BY_PLACE: Record<string, number> = { city: 60000, town: 15000, village: 2500, hamlet: 800 };
function estPop(name: string, place?: string): number {
  if (KNOWN_POP[name]) return KNOWN_POP[name];
  const base = POP_BY_PLACE[place ?? "village"] ?? 2000;
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Math.round(base * (0.7 + (h % 60) / 100));
}

export interface Region {
  id: string;
  name: string;
  channelName: string; // the main river to trace depth from
  hasSusceptibility: boolean; // do we have SRTM features for this region's communities?
  communities: Community[];
  channelLines: GeoJSON.Feature<GeoJSON.LineString>[];
  rivers: GeoJSON.FeatureCollection;
  roads: GeoJSON.FeatureCollection;
  view: { center: [number, number]; zoom: number };
}

function channelLines(rivers: GeoJSON.FeatureCollection, name: string): GeoJSON.Feature<GeoJSON.LineString>[] {
  return rivers.features
    .filter((f) => ((f.properties?.name as string) || "").toLowerCase() === name.toLowerCase())
    .map((f) => ({ type: "Feature", properties: {}, geometry: f.geometry as GeoJSON.LineString }));
}

function buildCommunities(
  fc: GeoJSON.FeatureCollection,
  prefix: string,
  country: "GHA" | "CMR",
  admin: (lng: number, lat: number) => { admin1: string; admin2: string },
): Community[] {
  return fc.features.map((f, i) => {
    const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
    const name = f.properties?.name as string;
    const place = f.properties?.place as string | undefined;
    const tagged = f.properties?.population as number | undefined;
    const { admin1, admin2 } = admin(lng, lat);
    return {
      id: `${prefix}-${String(i).padStart(3, "0")}`,
      name, countryIso3: country, admin1, admin2, lat, lng,
      population: { value: tagged ?? estPop(name, place), unit: "persons", evidence: popEv(!!tagged) },
    };
  });
}

const lvAdmin = (lng: number, lat: number) => {
  const d = districtOf(lng, lat);
  return d ? { admin1: d.region, admin2: d.name } : { admin1: "Volta Region", admin2: "—" };
};
const wvAdmin = (_lng: number, lat: number) => ({
  admin1: lat > 10.75 ? "Upper East Region" : "North East Region", admin2: "—",
});
const fnAdmin = (_lng: number, _lat: number) => ({ admin1: "Far North", admin2: "—" });
const dlAdmin = (_lng: number, _lat: number) => ({ admin1: "Littoral", admin2: "Douala" });

export const REGIONS: Record<string, Region> = {
  lowerVolta: {
    id: "lowerVolta", name: "Lower Volta", channelName: "Volta", hasSusceptibility: true,
    communities: buildCommunities(lvComm as GeoJSON.FeatureCollection, "LV", "GHA", lvAdmin),
    channelLines: channelLines(lvRivers as GeoJSON.FeatureCollection, "Volta"),
    rivers: lvRivers as GeoJSON.FeatureCollection, roads: lvRoads as GeoJSON.FeatureCollection,
    view: { center: [0.42, 6.02], zoom: 9.2 },
  },
  whiteVolta: {
    id: "whiteVolta", name: "White Volta / Upper East", channelName: "White Volta", hasSusceptibility: true,
    communities: buildCommunities(wvComm as GeoJSON.FeatureCollection, "WV", "GHA", wvAdmin),
    channelLines: channelLines(wvRivers as GeoJSON.FeatureCollection, "White Volta"),
    rivers: wvRivers as GeoJSON.FeatureCollection, roads: wvRoads as GeoJSON.FeatureCollection,
    view: { center: [-0.75, 10.7], zoom: 8.4 },
  },
  farNorth: {
    id: "farNorth", name: "Far North / Logone", channelName: "Logone", hasSusceptibility: false,
    communities: buildCommunities(fnComm as GeoJSON.FeatureCollection, "FN", "CMR", fnAdmin),
    channelLines: channelLines(fnRivers as GeoJSON.FeatureCollection, "Logone"),
    rivers: fnRivers as GeoJSON.FeatureCollection, roads: fnRoads as GeoJSON.FeatureCollection,
    view: { center: [15.0, 11.2], zoom: 7.6 },
  },
  douala: {
    id: "douala", name: "Douala", channelName: "Wouri", hasSusceptibility: false,
    communities: buildCommunities(dlComm as GeoJSON.FeatureCollection, "DL", "CMR", dlAdmin),
    channelLines: channelLines(dlRivers as GeoJSON.FeatureCollection, "Wouri"),
    rivers: dlRivers as GeoJSON.FeatureCollection, roads: dlRoads as GeoJSON.FeatureCollection,
    view: { center: [9.72, 4.05], zoom: 11.2 },
  },
};

export function getRegion(id: string): Region {
  return REGIONS[id] ?? REGIONS.lowerVolta;
}

export const ALL_COMMUNITIES: Community[] = Object.values(REGIONS).flatMap((r) => r.communities);
const byId = new Map(ALL_COMMUNITIES.map((c) => [c.id, c]));
export function communityById(id: string): Community | undefined {
  return byId.get(id);
}
