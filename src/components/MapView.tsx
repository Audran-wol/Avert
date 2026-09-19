import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, type StyleSpecification } from "maplibre-gl";
import { useStore, type Basemap, type Mode } from "../store";
import { usePathname } from "../platform/router";
import { usePreferencesStore } from "../stores/preferencesStore";
import { getEvent } from "../data/flood";
import { getRegion, communityById } from "../data/regions";
import { computeStep } from "../services/exposure";
import { computeForecastRisk } from "../services/forecast";
import { RISK_CLASS_COLOR } from "../models/contracts";
import { mapBus } from "../mapBus";
import { DISTRICTS_GEO } from "../data/districts";

const regionOf = (eventId: string) => getRegion(getEvent(eventId).regionId);

const COMM_SRC = "communities";
const FLOOD_SRC = "flood";
const RIVER_SRC = "rivers";

const STREETS = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
// Imagery is rendered through our own style so the raster paint can be tuned. Raw satellite
// tiles are far too saturated/bright to sit under flood overlays and panel text — pulling
// saturation and brightness down gives the calm dark-terrain look of the approved references.
const SATELLITE: StyleSpecification = {
  version: 8,
  // same font server the CARTO basemaps use, so one text-font stack works on every basemap
  glyphs: "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf",
  sources: {
    esri: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 19, attribution: "© Esri" },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#05070a" } },
    {
      id: "esri", type: "raster", source: "esri",
      paint: { "raster-saturation": -0.45, "raster-brightness-max": 0.72, "raster-contrast": -0.08, "raster-opacity": 0.95 },
    },
  ],
};
function styleFor(b: Basemap): string | StyleSpecification {
  if (b === "dark") return DARK;
  if (b === "satellite") return SATELLITE;
  return STREETS;
}

const STATUS_COLOR_MAP: Record<string, string> = { inundated: "#EE4B4B", "at-risk": "#E3B341", partial: "#F28A35", safe: "#7c8a99" };

function communityGeoJSON(eventId: string, step: number, mode: Mode) {
  const { snapshots } = computeStep(eventId, step);
  return {
    type: "FeatureCollection" as const,
    features: regionOf(eventId).communities.map((c) => {
      let color: string, minor: boolean, label: string;
      if (mode === "forecast") {
        const cls = computeForecastRisk(c.id)?.class ?? "low";
        color = RISK_CLASS_COLOR[cls];
        minor = cls === "low";
        label = `${cls.replace("-", " ")} risk`;
      } else {
        const st = snapshots.get(c.id)?.floodStatus ?? "safe";
        color = STATUS_COLOR_MAP[st];
        minor = st === "safe";
        label = st.replace("-", " ");
      }
      return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
        properties: { id: c.id, name: c.name, color, minor, label },
      };
    }),
  };
}
const EMPTY_FC = { type: "FeatureCollection" as const, features: [] };
function floodGeoJSON(eventId: string, step: number, mode: Mode) {
  if (mode === "forecast") return EMPTY_FC; // forecast is not a past-event extent
  return { type: "FeatureCollection" as const, features: [{ type: "Feature" as const, properties: {}, geometry: getEvent(eventId).steps[step].geometry }] };
}

function addLayers(map: MLMap) {
  // real district boundaries (geoBoundaries) as quiet context
  map.addSource("districts", { type: "geojson", data: DISTRICTS_GEO });
  // mid-gray reads on light (streets) and dark (satellite) basemaps alike
  map.addLayer({ id: "district-line", type: "line", source: "districts", paint: { "line-color": "#5b6b7a", "line-opacity": 0.28, "line-width": 1, "line-dasharray": [2, 3] } });

  map.addSource(RIVER_SRC, { type: "geojson", data: regionOf(useStore.getState().eventId).rivers });
  map.addLayer({ id: "river-line", type: "line", source: RIVER_SRC, paint: { "line-color": "#4aa6d6", "line-opacity": 0.42, "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.6, 12, 2] } });

  map.addSource(FLOOD_SRC, { type: "geojson", data: floodGeoJSON(useStore.getState().eventId, useStore.getState().stepIndex, useStore.getState().mode) });
  map.addLayer({ id: "flood-fill", type: "fill", source: FLOOD_SRC, paint: { "fill-color": "#4a9fd8", "fill-opacity": 0.3 } });
  map.addLayer({ id: "flood-line", type: "line", source: FLOOD_SRC, paint: { "line-color": "#8fd4ff", "line-width": 1, "line-opacity": 0.55 } });

  const st0 = useStore.getState();
  map.addSource(COMM_SRC, { type: "geojson", data: communityGeoJSON(st0.eventId, st0.stepIndex, st0.mode) });
  map.addLayer({ id: "comm-halo", type: "circle", source: COMM_SRC, filter: ["==", ["get", "id"], "___none___"], paint: { "circle-radius": 14, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#3b87f0", "circle-stroke-width": 2.5, "circle-stroke-opacity": 0.9 } });
  map.addLayer({
    id: "comm-dot", type: "circle", source: COMM_SRC,
    paint: {
      // "safe"/low-risk places stay deliberately tiny and dim: at 200+ communities the map is
      // unreadable if every settlement competes for attention. Signal scales with status.
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, ["case", ["get", "minor"], 1.8, 4.5], 13, ["case", ["get", "minor"], 3, 7.5]],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#05070a", "circle-stroke-width": 1.25,
      "circle-opacity": ["case", ["get", "minor"], 0.35, 0.95],
      "circle-stroke-opacity": ["case", ["get", "minor"], 0.3, 0.85],
    },
  });
  // Names for the communities that actually matter at this timestep, so the map is narratable
  // ("here is Volo") without hovering. Suppressed for minor/low-risk points to limit clutter.
  map.addLayer({
    id: "comm-label", type: "symbol", source: COMM_SRC,
    filter: ["!", ["get", "minor"]],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Regular", "Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 13, 13],
      "text-offset": [0, 1.1], "text-anchor": "top",
      "text-allow-overlap": false, "text-optional": true,
    },
    paint: { "text-color": "#eef3f7", "text-halo-color": "#04080c", "text-halo-width": 1.6, "text-halo-blur": 0.4 },
  });
}

function ensureLayers(map: MLMap) {
  if (!map.isStyleLoaded()) return;
  if (!map.getSource(COMM_SRC)) addLayers(map);
  applySelection(map, useStore.getState().selectedId);
}

export default function MapView() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const appliedBasemap = useRef<Basemap>(useStore.getState().basemap);
  const { selectedId, basemap, stepIndex, mode, eventId, askAvertOpen } = useStore();
  const selectCommunity = useStore((s) => s.selectCommunity);
  const path = usePathname();
  const units = usePreferencesStore((s) => s.preferences.units);
  const scaleRef = useRef<maplibregl.ScaleControl | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const view0 = regionOf(useStore.getState().eventId).view;
    const map = new maplibregl.Map({
      container: ref.current, style: styleFor(useStore.getState().basemap),
      center: view0.center, zoom: view0.zoom, attributionControl: { compact: true },
    });
    mapRef.current = map;
    mapBus.map = map;
    if (import.meta.env.DEV) { (window as unknown as Record<string, unknown>).__map = map; (window as unknown as Record<string, unknown>).__store = useStore; }
    const scale = new maplibregl.ScaleControl({ maxWidth: 90, unit: usePreferencesStore.getState().preferences.units });
    scaleRef.current = scale;
    map.addControl(scale, "bottom-left");
    map.on("error", (e) => console.error("[maplibre]", e.error?.message ?? e));
    map.on("styledata", () => ensureLayers(map));
    map.on("load", () => { map.resize(); ensureLayers(map); });
    map.on("click", "comm-dot", (e) => { const id = e.features?.[0]?.properties?.id as string; if (id) selectCommunity(id); });
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "fo-popup" });
    map.on("mousemove", "comm-dot", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = "pointer";
      const p = f.properties as { name: string; label: string; color: string };
      popup.setLngLat(e.lngLat).setHTML(`<span class="fo-tip-dot" style="background:${p.color}"></span><b>${p.name}</b><i>${p.label}</i>`).addTo(map);
    });
    map.on("mouseleave", "comm-dot", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
    return () => { map.remove(); mapRef.current = null; mapBus.map = null; };
  }, [selectCommunity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !scaleRef.current) return;
    map.removeControl(scaleRef.current);
    const scale = new maplibregl.ScaleControl({ maxWidth: 90, unit: units });
    scaleRef.current = scale;
    map.addControl(scale, "bottom-left");
  }, [units]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemap === appliedBasemap.current) return;
    appliedBasemap.current = basemap;
    // setStyle wipes custom sources/layers; the generic styledata handler is unreliable for
    // remote styles, so re-add explicitly once the new style has settled.
    map.setStyle(styleFor(basemap), { diff: false });
    map.once("idle", () => ensureLayers(map));
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    // the inspector/community list dock as real flex siblings (not overlays), so their
    // mount/unmount resizes the map container and the camera needs a resize to match.
    requestAnimationFrame(() => map.resize());
  }, [!!selectedId, path, askAvertOpen]);

  // timeline step / mode → update flood extent + community colouring
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource(FLOOD_SRC) as maplibregl.GeoJSONSource | undefined)?.setData(floodGeoJSON(eventId, stepIndex, mode));
    (map.getSource(COMM_SRC) as maplibregl.GeoJSONSource | undefined)?.setData(communityGeoJSON(eventId, stepIndex, mode));
  }, [eventId, stepIndex, mode]);

  // event change → swap region rivers + fly to the region
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) (map.getSource(RIVER_SRC) as maplibregl.GeoJSONSource | undefined)?.setData(regionOf(eventId).rivers);
    const v = regionOf(eventId).view;
    map.flyTo({ center: v.center, zoom: v.zoom, duration: 1400, essential: true });
  }, [eventId]);

  // selection → fly + halo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) applySelection(map, selectedId);
    if (selectedId) {
      const c = communityById(selectedId);
      if (c) map.flyTo({ center: [c.lng, c.lat], zoom: 12.5, duration: 1400, essential: true });
    } else {
      const v = regionOf(eventId).view;
      map.flyTo({ center: v.center, zoom: v.zoom, duration: 1200, essential: true });
    }
  }, [selectedId]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}

function applySelection(map: MLMap, selectedId: string | null) {
  if (map.getLayer("comm-halo")) map.setFilter("comm-halo", ["==", ["get", "id"], selectedId ?? "___none___"]);
}
