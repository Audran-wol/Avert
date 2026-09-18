import { ChevronRight, Waves, History } from "lucide-react";
import { useStore } from "../store";
import { getEvent, eventsInRegion, EXTENT_EVIDENCE } from "../data/flood";
import { getRegion } from "../data/regions";
import { DRIVERS, MECHANISM_NOTE, getForecastHazard } from "../data/conditions";
import { recurrenceForZone } from "../data/history";
import { computeStep, communityById } from "../services/exposure";
import { forecastRanking } from "../services/forecast";
import { PRIORITY_COLOR, RISK_CLASS_COLOR } from "../models/contracts";
import { Evidence } from "./Evidence";
import AnimatedNumber from "./AnimatedNumber";

const REGION_TABS: { id: string; label: string; zone: string; country: "Ghana" | "Cameroon" }[] = [
  { id: "lowerVolta", label: "Lower Volta", zone: "Lower Volta", country: "Ghana" },
  { id: "whiteVolta", label: "White Volta", zone: "White Volta", country: "Ghana" },
  { id: "farNorth", label: "Far North", zone: "Far North / Logone", country: "Cameroon" },
  { id: "douala", label: "Douala", zone: "Douala", country: "Cameroon" },
];

export default function LeftPanel() {
  const { eventId, mode, setHistoryOpen, setEvent, setPanelOpen } = useStore();
  const event = getEvent(eventId);

  const switchRegion = (rid: string) => {
    if (rid === event.regionId) return;
    const evs = eventsInRegion(rid);
    setEvent(evs[evs.length - 1].id);
  };

  const currentCountry = REGION_TABS.find((r) => r.id === event.regionId)?.country ?? "Ghana";
  const switchCountry = (c: "Ghana" | "Cameroon") => {
    if (c === currentCountry) return;
    switchRegion(REGION_TABS.find((r) => r.country === c)!.id);
  };

  return (
    <aside className="w-[380px] h-full min-h-0 shrink-0 bg-paper text-paper-ink flex flex-col overflow-y-auto z-20">
      {/* top bar: History + basin toggle (always) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-1 text-sm text-paper-sub hover:text-paper-ink"><History size={15} /> History</button>
          <button type="button" onClick={() => setPanelOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-paper-muted text-paper-sub hover:text-paper-ink" aria-label="Collapse panel"><ChevronRight size={14} className="rotate-180" /></button>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* country switch */}
          <div className="flex bg-paper-muted rounded-lg p-0.5 gap-0.5">
            {(["Ghana", "Cameroon"] as const).map((c) => (
              <button key={c} onClick={() => switchCountry(c)} className={`px-3 py-1 rounded-md text-[11px] font-semibold ${currentCountry === c ? "bg-white shadow-sm text-paper-ink" : "text-paper-sub"}`}>{c}</button>
            ))}
          </div>
          {/* regions within the selected country */}
          <div className="flex bg-paper-muted rounded-lg p-0.5 gap-0.5">
            {REGION_TABS.filter((r) => r.country === currentCountry).map((r) => (
              <button key={r.id} onClick={() => switchRegion(r.id)} className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${event.regionId === r.id ? "bg-white shadow-sm text-paper-ink" : "text-paper-sub"}`}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mode === "observed" ? <ObservedPanel /> : <ForecastPanel />}
      </div>
    </aside>
  );
}

function ObservedPanel() {
  const { eventId, stepIndex, selectCommunity, setEvent } = useStore();
  const event = getEvent(eventId);
  const meta = event.meta;
  const region = getRegion(event.regionId);
  const steps = event.steps;
  const { snapshots, priorities } = computeStep(eventId, stepIndex);
  const snaps = [...snapshots.values()];
  const inundated = snaps.filter((s) => s.floodStatus === "inundated").length;
  const atRisk = snaps.filter((s) => s.floodStatus === "at-risk").length;
  const exposed = snaps.reduce((a, s) => a + (s.populationExposed?.value ?? 0), 0);
  const areaHa = steps[stepIndex].areaHa;
  const day = steps[stepIndex].day;

  return (
    <>
      <div>
        <div className="flex items-center gap-2">
          <Waves size={16} className="text-[#2b8fd6]" />
          <h2 className="text-lg font-semibold leading-tight">{meta.name}</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2b8fd6]/15 text-[#1c6fae] uppercase tracking-wide">{meta.mechanism}</span>
          <span className="text-xs text-paper-sub">{meta.startTime} → {meta.endTime}</span>
        </div>
        {/* year selector for this basin */}
        <div className="flex gap-1 mt-2">
          {eventsInRegion(event.regionId).map((e) => (
            <button key={e.id} onClick={() => setEvent(e.id)} className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium mono border ${eventId === e.id ? "bg-[#2b8fd6]/15 text-[#1c6fae] border-[#2b8fd6]/30" : "text-paper-sub border-black/[0.08] hover:bg-paper-muted"}`}>{e.label}</button>
          ))}
        </div>
        <p className="text-[11px] text-paper-faint mt-2 leading-relaxed">Inundation as of <span className="mono text-paper-ink">{day}</span> · modeled extent <Evidence ev={EXTENT_EVIDENCE} /></p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric value={<AnimatedNumber value={inundated} format={(v) => String(Math.round(v))} />} label="Communities inundated" sub={`${atRisk} at-risk`} subColor={PRIORITY_COLOR.priority} />
        <Metric value={<AnimatedNumber value={exposed} format={(v) => `≈${(v / 1000).toFixed(1)}k`} />} label="People exposed" chip="ASSESSED" />
        <Metric value={<AnimatedNumber value={areaHa} format={(v) => `${(v / 100).toFixed(0)} km²`} />} label="Area flooded" chip="INFERRED" />
        <Metric value={meta.impact.displaced ? `≈${(meta.impact.displaced.value / 1000).toFixed(0)}k` : "—"} label="Displaced (event)" chip={meta.impact.displaced ? "REPORTED" : ""} />
      </div>

      {/* primary cause — the main reason the whole area flooded (both basins) */}
      <div className="bg-[#2b8fd6]/[0.06] rounded-xl p-3 border border-[#2b8fd6]/25">
        <div className="label-dark mb-0.5 text-[#1c6fae]">Why {region.name} flooded · {meta.mechanism}</div>
        <p className="text-[12px] text-paper-ink leading-relaxed">{meta.summary}</p>
      </div>

      {/* detailed drivers timeline (dam-release events) */}
      {event.regionId === "lowerVolta" && (
        <div className="bg-paper-card rounded-xl p-3 border border-black/[0.05]">
          <div className="label-dark mb-0.5">Event drivers · {meta.mechanism}</div>
          <p className="text-[10px] text-paper-faint mb-2">{MECHANISM_NOTE.observed}</p>
          <div className="space-y-0">
            {DRIVERS.filter((d) => d.mode !== "forecast").map((d, i, arr) => (
              <div key={d.id} className="relative pl-4 pb-2.5">
                {i < arr.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-black/10" />}
                <span className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#2b8fd6" }} />
                <div className="flex items-center gap-1.5 flex-wrap"><span className="text-xs font-medium">{d.label}</span><span className="mono text-[11px] text-paper-sub">{d.value}</span><Evidence ev={d.evidence} /></div>
                <div className="text-[10px] text-paper-faint leading-snug">{d.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Queue rows={priorities.filter((p) => p.score > 0).slice(0, 7).map((p) => ({ id: p.communityId, val: p.score, color: PRIORITY_COLOR[p.level] }))} title="Response Priority" sub="who to reach first" onSelect={selectCommunity} />
    </>
  );
}

function ForecastPanel() {
  const { eventId, selectCommunity } = useStore();
  const region = getRegion(getEvent(eventId).regionId);
  const hazard = getForecastHazard(region.id);
  const zone = REGION_TABS.find((r) => r.id === region.id)?.zone ?? "Lower Volta";
  const rec = recurrenceForZone(zone);
  const ranking = forecastRanking(region.communities);
  const severe = ranking.filter((r) => r.class === "severe").length;
  const high = ranking.filter((r) => r.class === "high").length;
  const atRisk = severe + high;

  return (
    <>
      <div>
        <div className="flex items-center gap-2">
          <Waves size={16} className="text-cyan" />
          <h2 className="text-lg font-semibold leading-tight">Next-flood risk</h2>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan/15 text-cyan uppercase tracking-wide">Forecast</span>
          <span className="text-xs text-paper-sub">{region.name} · ~48 h lead</span>
        </div>
        <p className="text-[11px] text-paper-faint mt-1.5 leading-relaxed">Where flooding could occur if current conditions resemble the historical pattern. Ordinal index — not a calibrated probability.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Metric value={<AnimatedNumber value={atRisk} format={(v) => String(Math.round(v))} />} label="Communities HIGH+ risk" subColor={RISK_CLASS_COLOR.high} sub={`${severe} severe`} />
        <Metric value={<AnimatedNumber value={rec.count} format={(v) => `${Math.round(v)}×`} />} label={`${zone} floods since 2007`} chip="REPORTED" />
        <Metric value={`${high}`} label="High risk" chip="ASSESSED" />
        <Metric value={"~48 h"} label="Forecast lead" chip="FORECAST" />
      </div>

      {/* pattern / current conditions */}
      <div className="bg-paper-card rounded-xl p-3 border border-black/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <span className="label-dark">Current conditions · pattern match</span>
          <span className="mono text-sm font-semibold text-cyan">{Math.round(hazard.patternMatch * 100)}%</span>
        </div>
        <p className="text-[10px] text-paper-faint mb-2">{zone} flooded {rec.count}× ({rec.years.join(", ")}).</p>
        {hazard.matches.map((m) => (
          <div key={m.label} className={`flex items-center gap-2 py-0.5 text-[11px] ${m.matched ? "" : "opacity-40"}`}>
            <span className={m.matched ? "text-low" : "text-paper-faint"}>{m.matched ? "✓" : "○"}</span>
            <span className="flex-1 min-w-0 truncate">{m.label}</span>
            <Evidence ev={m.evidence} />
          </div>
        ))}
      </div>

      <Queue rows={ranking.slice(0, 7).map((r) => ({ id: r.communityId, val: r.index, color: RISK_CLASS_COLOR[r.class] }))} title="Next-flood risk" sub="where could flood" onSelect={selectCommunity} />
    </>
  );
}

function Queue({ rows, title, sub, onSelect }: { rows: { id: string; val: number; color: string }[]; title: string; sub: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-dark">{title}</span>
        <span className="text-[10px] text-paper-faint">{sub}</span>
      </div>
      <div className="space-y-0.5">
        {rows.map((row, i) => {
          const c = communityById(row.id);
          return (
            <button key={row.id} onClick={() => onSelect(row.id)} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-paper-muted text-left transition-colors">
              <span className="mono text-xs text-paper-faint w-5">{String(i + 1).padStart(2, "0")}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
              <span className="flex-1 min-w-0">
                <span className="text-xs block font-medium truncate">{c?.name}</span>
                <span className="text-[10px] text-paper-sub block truncate">{c?.admin2 !== "—" ? `${c?.admin2}, ` : ""}{c?.admin1}</span>
              </span>
              <span className="mono text-sm font-semibold" style={{ color: row.color }}>{row.val}</span>
              <ChevronRight size={14} className="text-paper-faint" />
            </button>
          );
        })}
        {rows.length === 0 && <div className="text-[11px] text-paper-faint px-2 py-3">No communities match at this step.</div>}
      </div>
    </div>
  );
}

function Metric({ value, label, sub, subColor, chip }: { value: React.ReactNode; label: string; sub?: string; subColor?: string; chip?: string }) {
  return (
    <div className="bg-paper-card rounded-xl p-3 border border-black/[0.05]">
      <div className="text-2xl font-semibold mono leading-none">{value}</div>
      <div className="label-dark mt-1.5">{label}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: subColor ?? "var(--color-paper-sub)" }}>{sub}</div>}
      {chip && <div className="mt-1 text-[8px] font-semibold text-paper-faint">{chip}</div>}
    </div>
  );
}
