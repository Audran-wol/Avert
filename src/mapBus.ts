import type { Map as MLMap } from "maplibre-gl";

// Tiny shared handle so map furniture (zoom, locate, pitch) can drive the map
// instance without prop-drilling. ponytail: a module ref beats a context for one map.
export const mapBus: { map: MLMap | null } = { map: null };
