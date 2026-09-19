import { useState } from "react";
import { ChevronDown, Waves, Radar } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";
import { computeStep } from "../services/exposure";
import { forecastRanking } from "../services/forecast";
import { recurrenceForZone } from "../data/history";
import AnimatedNumber from "./AnimatedNumber";

const ZONE_LABEL: Record<string, string> = { lowerVolta: "Lower Volta", whiteVolta: "White Volta", farNorth: "Far North / Logone", douala: "Douala" };

export default function EventSummaryOverlay() {
  const { eventId, stepIndex, mode } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const event = getEvent(eventId);
  const region = getRegion(event.regionId);

  const forecast = mode === "forecast";
  let title: string, subtitle: string, metrics: { value: React.ReactNode; label: string }[];

  if (forecast) {
    const zone = ZONE_LABEL[region.id] ?? region.name;
    const ranking = forecastRanking(region.communities);
    const severe = ranking.filter((r) => r.class === "severe").length;
    const atRisk = severe + ranking.filter((r) => r.class === "high").length;
    const rec = recurrenceForZone(zone);
    title = "Next-flood risk";
    subtitle = `${region.name} · ~48 h lead · ordinal index`;
    metrics = [
      { value: <AnimatedNumber value={atRisk} format={(v) => String(Math.round(v))} />, label: "High+ risk" },
      { value: <AnimatedNumber value={severe} format={(v) => String(Math.round(v))} />, label: "Severe" },
      { value: <AnimatedNumber value={rec.count} format={(v) => `${Math.round(v)}×`} />, label: "Floods since 2007" },
    ];
  } else {
    const { snapshots } = computeStep(eventId, stepIndex);
    const snaps = [...snapshots.values()];
    const inundated = snaps.filter((s) => s.floodStatus === "inundated").length;
    const exposed = snaps.reduce((a, s) => a + (s.populationExposed?.value ?? 0), 0);
    const areaHa = event.steps[stepIndex].areaHa;
    title = event.meta.name;
    subtitle = `${event.meta.mechanism.replace("-", " ")} · as of ${event.steps[stepIndex]?.day ?? event.meta.startTime}`;
    metrics = [
      { value: <AnimatedNumber value={inundated} format={(v) => String(Math.round(v))} />, label: "Communities" },
      { value: <AnimatedNumber value={exposed} format={(v) => `≈${(v / 1000).toFixed(1)}k`} />, label: "Est. exposure" },
      { value: <AnimatedNumber value={areaHa} format={(v) => `${(v / 100).toFixed(0)} km²`} />, label: "Modeled extent" },
    ];
  }

  return (
    <div className="glass-panel absolute top-3 left-3 z-10 w-[360px] max-w-[calc(100%-1.5rem)] overflow-hidden">
      <button onClick={() => setCollapsed((v) => !v)} className="w-full flex items-start gap-2.5 px-3.5 py-3 text-left">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${forecast ? "bg-action/15 text-action" : "bg-flood/15 text-flood"}`}>
          {forecast ? <Radar size={15} /> : <Waves size={15} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-tight text-ink">{title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-faint">{subtitle}</span>
        </span>
        <ChevronDown size={15} className={`mt-1 shrink-0 text-faint transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {metrics.map((m) => (
            <div key={m.label} className="px-3 py-2.5">
              <div className="mono text-[17px] font-semibold leading-none text-ink">{m.value}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-faint">{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
