import { LayoutGrid, Radar, Layers, History, Settings } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store";
import { mapBus } from "../mapBus";

const LAYER_KEYS = [
  { key: "district-line", label: "Districts" },
  { key: "river-line", label: "Rivers" },
  { key: "comm-dot", label: "Communities" },
  { key: "flood-fill", label: "Flood extent" },
] as const;

export default function NavRail() {
  const { mode, setMode, setHistoryOpen, setBasemap, basemap } = useStore();
  const [active, setActive] = useState(mode === "forecast" ? "Forecast" : "Overview");
  const [layersOpen, setLayersOpen] = useState(false);

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    const map = mapBus.map;
    if (!map || !map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  };

  const handleAction = (label: string) => {
    setActive(label);
    if (label === "Overview") setMode("observed");
    if (label === "Forecast") setMode("forecast");
    if (label === "History") setHistoryOpen(true);
    if (label === "Settings") setBasemap(basemap === "streets" ? "dark" : "streets");
    if (label === "Data Layers") setLayersOpen((v) => !v);
  };

  return (
    <nav className="w-[60px] shrink-0 flex flex-col items-center py-3 gap-1 bg-panel border-r border-white/10 z-20 relative">
      <button title="Overview" onClick={() => handleAction("Overview")} className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active === "Overview" ? "bg-hover text-cyan" : "text-muted hover:text-ink hover:bg-elevated"}`}>
        {active === "Overview" && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan" />}
        <LayoutGrid size={18} />
      </button>
      <button title="Forecast" onClick={() => handleAction("Forecast")} className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active === "Forecast" ? "bg-hover text-cyan" : "text-muted hover:text-ink hover:bg-elevated"}`}>
        {active === "Forecast" && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan" />}
        <Radar size={18} />
      </button>
      <div className="relative">
        <button title="Data Layers" onClick={() => handleAction("Data Layers")} className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active === "Data Layers" ? "bg-hover text-cyan" : "text-muted hover:text-ink hover:bg-elevated"}`}>
          {active === "Data Layers" && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan" />}
          <Layers size={18} />
        </button>
        {layersOpen && (
          <div className="absolute left-[52px] top-0 z-30 w-[170px] rounded-xl border border-white/10 bg-panel/95 p-2.5 shadow-2xl backdrop-blur-sm">
            {LAYER_KEYS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-2 text-[11px] text-paper-sub py-1.5 cursor-pointer">
                <span>{label}</span>
                <input type="checkbox" defaultChecked onChange={(e) => setLayerVisibility(key, e.target.checked)} className="h-3.5 w-3.5 accent-cyan" />
              </label>
            ))}
          </div>
        )}
      </div>
      <button title="History" onClick={() => handleAction("History")} className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active === "History" ? "bg-hover text-cyan" : "text-muted hover:text-ink hover:bg-elevated"}`}>
        {active === "History" && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan" />}
        <History size={18} />
      </button>
      <button title="Settings" onClick={() => handleAction("Settings")} className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${active === "Settings" ? "bg-hover text-cyan" : "text-muted hover:text-ink hover:bg-elevated"}`}>
        {active === "Settings" && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan" />}
        <Settings size={18} />
      </button>
    </nav>
  );
}
