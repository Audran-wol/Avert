import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Basemap } from "../store";

const STYLES: Record<Basemap, string> = {
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  satellite: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

/** Decorative, non-interactive map — real geographic data, but never claims scale/coordinate
 * authority. Used as a banner on Account/Preferences (docs/avert-refactor 06 correction #2, #9). */
export default function MapBanner({ center, zoom = 8, basemap = "dark", className }: { center: [number, number]; zoom?: number; basemap?: Basemap; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({ container: ref.current, style: STYLES[basemap], center, zoom, interactive: false, attributionControl: false });
    return () => map.remove();
  }, [basemap, center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} aria-hidden="true" className={className ?? "h-full w-full"} />;
}
