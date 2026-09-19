import { useState } from "react";
import { Navigation, Box, Moon, Satellite, Map as MapIcon, Check } from "lucide-react";
import { useStore, type Basemap } from "../store";
import { mapBus } from "../mapBus";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";

const BASEMAPS: { id: Basemap; icon: typeof Moon; label: string }[] = [
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "satellite", icon: Satellite, label: "Satellite" },
  { id: "streets", icon: MapIcon, label: "Streets" },
];

// ponytail: no +/- buttons — scroll and pinch already zoom, and the stacked control column
// was eating map real estate. Recenter and 2D/3D stay because nothing else exposes them.
export default function MapControls() {
  const { basemap, setBasemap, selectCommunity, eventId } = useStore();
  const [open, setOpen] = useState(false);

  const reset = () => {
    selectCommunity(null);
    const v = getRegion(getEvent(eventId).regionId).view;
    mapBus.map?.flyTo({ center: v.center, zoom: v.zoom, pitch: 0, bearing: 0, duration: 1200 });
  };
  const pitch = () => { const m = mapBus.map; if (m) m.easeTo({ pitch: m.getPitch() > 5 ? 0 : 55, duration: 500 }); };

  const active = BASEMAPS.find((b) => b.id === basemap) ?? BASEMAPS[0];

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
      <div className="glass-panel relative flex items-center p-1">
        <button onClick={() => setOpen((v) => !v)} title={`Basemap: ${active.label}`} aria-label={`Basemap: ${active.label}`} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-ink hover:bg-hover">
          <active.icon size={14} /> <span className="max-sm:hidden">{active.label}</span>
        </button>
        {open && (
          <div className="glass-panel absolute bottom-full right-0 mb-1.5 w-40 overflow-hidden p-1">
            {BASEMAPS.map((b) => (
              <button
                key={b.id}
                onClick={() => { setBasemap(b.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${basemap === b.id ? "text-action" : "text-ink hover:bg-hover"}`}
              >
                <b.icon size={14} /> <span className="flex-1">{b.label}</span>
                {basemap === b.id && <Check size={13} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel flex items-center p-1">
        <Ctrl icon={Navigation} label="Recenter event" onClick={reset} />
        <Ctrl icon={Box} label="Toggle 2D / 3D" onClick={pitch} />
      </div>
    </div>
  );
}

function Ctrl({ icon: Icon, label, onClick }: { icon: typeof Navigation; label: string; onClick: () => void }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-ink">
      <Icon size={15} />
    </button>
  );
}
