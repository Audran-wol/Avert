import { Plus, Minus, Navigation, Box, Moon, Satellite, Map as MapIcon } from "lucide-react";
import { useStore, type Basemap } from "../store";
import { mapBus } from "../mapBus";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";

const BASEMAPS: { id: Basemap; icon: typeof Moon; label: string }[] = [
  { id: "streets", icon: MapIcon, label: "Streets" },
  { id: "satellite", icon: Satellite, label: "Satellite" },
  { id: "dark", icon: Moon, label: "Dark" },
];

export default function MapControls() {
  const { basemap, setBasemap, selectCommunity, eventId } = useStore();
  const zoom = (d: number) => mapBus.map?.easeTo({ zoom: (mapBus.map.getZoom() ?? 9) + d, duration: 300 });
  const reset = () => { selectCommunity(null); const v = getRegion(getEvent(eventId).regionId).view; mapBus.map?.flyTo({ center: v.center, zoom: v.zoom, pitch: 0, bearing: 0, duration: 1200 }); };
  const pitch = () => { const m = mapBus.map; if (m) m.easeTo({ pitch: m.getPitch() > 5 ? 0 : 55, duration: 500 }); };

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      <div className="flex bg-panel/90 backdrop-blur rounded-lg border border-white/10 p-1">
        {BASEMAPS.map((b) => (
          <button key={b.id} onClick={() => setBasemap(b.id)} title={b.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${basemap === b.id ? "bg-hover text-cyan" : "text-muted hover:text-ink"}`}>
            <b.icon size={14} /> {b.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col bg-panel/90 backdrop-blur rounded-lg border border-white/10 overflow-hidden divide-y divide-white/10">
        <Ctrl icon={Plus} label="Zoom in" onClick={() => zoom(1)} />
        <Ctrl icon={Minus} label="Zoom out" onClick={() => zoom(-1)} />
        <Ctrl icon={Navigation} label="Recenter event" onClick={reset} />
        <Ctrl icon={Box} label="2D / 3D" onClick={pitch} />
      </div>
    </div>
  );
}

function Ctrl({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return <button title={label} onClick={onClick} className="w-9 h-9 flex items-center justify-center text-muted hover:text-ink hover:bg-hover transition-colors"><Icon size={16} /></button>;
}
