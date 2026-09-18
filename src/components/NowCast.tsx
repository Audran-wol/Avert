import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";
import { fetchRainSnapshot, getCachedRainSnapshot, type RainSnapshot } from "../services/weather";

// Live now-cast: current flood pressure per region, derived ONLY from live Open-Meteo
// rainfall (next 72h + prior 7d). This is the one genuinely live signal in the demo, so
// it's labeled FORECAST — modeled pressure from real rain, never an observed flood.
// ponytail: band thresholds are heuristic; tune against real events if we get ground truth.

const REFRESH_MS = 20 * 60 * 1000; // rain daily-sums move slowly; 20 min is plenty

function band(pressure: number) {
  if (pressure >= 0.6) return { label: "High", color: "#f85149" };
  if (pressure >= 0.35) return { label: "Moderate", color: "#d29922" };
  return { label: "Low", color: "#3fb950" };
}

export default function NowCast() {
  const eventId = useStore((s) => s.eventId);
  const regionId = getEvent(eventId).regionId;
  const [snap, setSnap] = useState<RainSnapshot | undefined>(() => getCachedRainSnapshot(regionId));

  useEffect(() => {
    let active = true;
    const load = () => {
      setSnap(getCachedRainSnapshot(regionId)); // show cached instantly on region switch
      void fetchRainSnapshot(regionId).then((s) => { if (active) setSnap(s); }).catch(() => undefined);
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { active = false; clearInterval(t); };
  }, [regionId]);

  if (!snap) return null;
  const b = band(snap.rainPressure);
  const level = Math.round(snap.rainPressure * 100);

  return (
    <div
      className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2 whitespace-nowrap rounded-full border bg-panel/90 backdrop-blur px-3 py-1.5 text-[11px] shadow-lg"
      style={{ borderColor: `${b.color}66` }}
      title="Modeled flood pressure from live rainfall — not an observed flood (Open-Meteo, updated automatically)"
    >
      <span className="flex items-center gap-1 text-cyan uppercase tracking-[0.16em] text-[9px]">
        <Radio size={11} className="animate-pulse" /> Live
      </span>
      <span className="text-ink font-medium">{getRegion(regionId).name}</span>
      <span className="text-white/20">·</span>
      <span className="flex items-center gap-1.5" style={{ color: b.color }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
        <span className="font-semibold">{b.label}</span>
        <span className="tabular-nums opacity-80">{level}</span>
      </span>
      <span className="text-muted tabular-nums">{snap.next72mm.toFixed(0)}/72h · {snap.past7mm.toFixed(0)}/7d mm</span>
      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-muted/80">Forecast</span>
    </div>
  );
}
