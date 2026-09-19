import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";
import { mapBus } from "../mapBus";

const LAYER_KEYS = [
  { key: "district-line", label: "Districts" },
  { key: "river-line", label: "Rivers" },
  { key: "comm-dot", label: "Communities" },
  { key: "flood-fill", label: "Flood extent" },
] as const;

export default function LayersControl() {
  const [open, setOpen] = useState(false);

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    const map = mapBus.map;
    if (!map || !map.getLayer(layerId)) return;
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  };

  return (
    <div className="absolute right-3 top-3 z-10">
      <button onClick={() => setOpen((v) => !v)} className="glass-panel flex h-9 items-center gap-1.5 px-3 text-xs font-medium text-ink transition-colors hover:bg-hover">
        <Layers size={13} /> Layers <ChevronDown size={12} className={`text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="glass-panel absolute right-0 top-full mt-1.5 w-[180px] p-1.5">
          {LAYER_KEYS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-[11.5px] text-muted transition-colors hover:bg-hover hover:text-ink">
              <span>{label}</span>
              <input type="checkbox" defaultChecked onChange={(e) => setLayerVisibility(key, e.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-action)]" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
