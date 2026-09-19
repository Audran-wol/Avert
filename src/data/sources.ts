import type { EvidenceState } from "../models/contracts";

// Honest source registry for THIS build (subset of Transition/01_MASTER_SOURCE_CATALOG).
// status reflects reality: what is actually fetched vs curated vs still planned.
export type Integration = "real" | "curated" | "modeled" | "manual" | "planned";

export interface SourceEntry {
  id: string;
  name: string;
  group: string;
  role: string;
  state: EvidenceState;
  status: Integration;
  note?: string;
}

export const INTEGRATION_LABEL: Record<Integration, string> = {
  real: "Fetched live",
  curated: "Real value · manual",
  modeled: "Modeled by Avert",
  manual: "Manual / cited",
  planned: "Planned",
};
export const INTEGRATION_COLOR: Record<Integration, string> = {
  real: "#31C48D",
  curated: "#42C8E8",
  modeled: "#E3B341",
  manual: "#8B5CF6",
  planned: "#667482",
};

export const SOURCES: SourceEntry[] = [
  // --- fetched live ---
  { id: "SRC-052", name: "OpenStreetMap (Overpass)", group: "Infrastructure", role: "Communities, rivers, roads, water bodies", state: "OBSERVED", status: "real", note: "206 settlements, 98 river ways, 253 roads" },
  { id: "SRC-056", name: "geoBoundaries gbOpen", group: "Boundaries", role: "Ghana ADM2 district boundaries + admin join", state: "OBSERVED", status: "real", note: "GSS/USAID · CC BY 4.0 · 28 districts in AOI" },
  { id: "SRC-038", name: "SRTM 30m · OpenTopoData", group: "Terrain", role: "Elevation → HAND, distance-to-drainage, baseline susceptibility", state: "INFERRED", status: "real", note: "Real elevation per community; HAND approximated" },
  { id: "SRC-059", name: "GDACS", group: "Disaster history", role: "Verified major flood events (2007, 2015)", state: "REPORTED", status: "real", note: "Live fetch; only alert-threshold events" },
  { id: "SRC-OPENMETEO", name: "Open-Meteo", group: "Rainfall", role: "Daily precipitation forecast + antecedent accumulations", state: "FORECAST", status: "real", note: "Free client-side fetch by region centroid; no API key required" },
  { id: "CM-SRC-CEMS", name: "Copernicus EMS / CEMS mapping portal", group: "Flood observation", role: "Observed flood delineation and emergency mapping", state: "OBSERVED", status: "real", note: "Live emergency mapping archive for activation pages like EMSN082 and EMSR779" },
  { id: "CM-SRC-CHARTER", name: "Disasters Charter activations", group: "Flood observation", role: "Satellite-based event activation for flood response", state: "OBSERVED", status: "real", note: "Public activation pages are fetchable and useful as event-level evidence" },
  { id: "CM-SRC-UNDRR", name: "UNDRR / Cameroon flood-risk note", group: "Risk reporting", role: "National narrative on recurrent urban flood risk", state: "REPORTED", status: "real", note: "Live public web article; appropriate for risk context rather than event geometry" },
  { id: "CM-SRC-WIKIMEDIA", name: "Wikimedia Commons", group: "Open media", role: "Geotagged flood imagery for Yagoua and Douala", state: "OBSERVED", status: "real", note: "Open-licensed community photographs; attribution required" },
  // --- modeled by us (clearly labeled) ---
  { id: "SRC-030", name: "Modeled floodplain (Volta channel buffer)", group: "Flood observation", role: "Inundation extent per day", state: "INFERRED", status: "modeled", note: "Upgrade target: Copernicus GFM / CEMS observed extent" },
  // --- curated real values (manual, cited) ---
  { id: "SRC-006", name: "VRA Akosombo/Kpong spillage", group: "Dam operations", role: "Dam-release dates & context", state: "REPORTED", status: "curated" },
  { id: "SRC-061", name: "IFRC GO / NADMO", group: "Humanitarian", role: "Displaced (~26k)", state: "REPORTED", status: "curated" },
  { id: "SRC-060", name: "ReliefWeb / OCHA", group: "Humanitarian", role: "Affected (~43k)", state: "REPORTED", status: "curated" },
  { id: "SRC-058", name: "EM-DAT", group: "Disaster history", role: "Event record & impacts", state: "REPORTED", status: "curated" },
  { id: "SRC-007", name: "Ghana Statistical Service · 2021 PHC", group: "Population", role: "District population control totals", state: "REPORTED", status: "curated" },
  { id: "CM-SRC-ENEO", name: "Eneo Cameroon / Lagdo notices", group: "Dam operations", role: "Lagdo releases and reservoir management", state: "REPORTED", status: "manual", note: "Operational notices and press updates; not a live telemetry feed" },
  { id: "CM-SRC-WORLDBANK", name: "World Bank / Far North flood management", group: "Infrastructure", role: "Project-history reconstruction of Logone-Maga protection works", state: "REPORTED", status: "manual", note: "Critical historical source for project and dyke rehabilitation context" },
  { id: "CM-SRC-ONACC", name: "ONACC climate and geospatial library", group: "Climate / geospatial", role: "Bullets, climate context, regional risk layers", state: "FORECAST", status: "manual", note: "Useful as a bulletin/source hub, but not a real-time API" },
  { id: "CM-SRC-MINHDU", name: "MINHDU / Cameroon urban flood records", group: "Urban drainage", role: "Urban flooding response and local event narrative", state: "REPORTED", status: "manual", note: "Official incident articles; not a machine-readable event feed" },
  { id: "CM-SRC-UNFPA", name: "UNFPA rapid assessment context", group: "Humanitarian", role: "Flash-flood impact and vulnerability assessment", state: "REPORTED", status: "manual", note: "Useful for event narrative and exposure context, not a sensor feed" },
  // --- planned (not yet integrated) ---
  { id: "SRC-028", name: "Copernicus Global Flood Monitoring", group: "Flood observation", role: "Observed Sentinel-1 flood extent", state: "OBSERVED", status: "planned", note: "Requires Copernicus auth" },
  { id: "SRC-029", name: "Copernicus EMS Rapid Mapping", group: "Flood observation", role: "Authoritative delineation", state: "OBSERVED", status: "planned", note: "No public activation for this event" },
  { id: "SRC-047", name: "WorldPop", group: "Population", role: "Gridded exposure in flood extent", state: "ASSESSED", status: "planned", note: "Async API unstable at build time" },
  { id: "SRC-032", name: "JRC Global Surface Water", group: "Flood observation", role: "Permanent-water removal", state: "OBSERVED", status: "planned" },
  { id: "SRC-024", name: "GloFAS", group: "Hydrology", role: "River discharge & forecast", state: "FORECAST", status: "planned", note: "Copernicus EWDS" },
  { id: "SRC-026", name: "Google Flood Forecasting API", group: "Hydrology", role: "Riverine forecast & gauges", state: "FORECAST", status: "planned", note: "Approval + API key" },
  { id: "SRC-017", name: "NASA IMERG", group: "Rainfall", role: "Trigger rainfall & accumulations", state: "OBSERVED", status: "planned" },
  { id: "SRC-018", name: "CHIRPS v3", group: "Rainfall", role: "Rainfall climatology / percentiles", state: "OBSERVED", status: "planned" },
];

export function sourceCounts() {
  const by = (s: Integration) => SOURCES.filter((x) => x.status === s).length;
  return { real: by("real"), curated: by("curated"), modeled: by("modeled"), manual: by("manual"), planned: by("planned"), total: SOURCES.length };
}
