import { useState } from "react";
import { ChevronDown, History as HistoryIcon, Radar, Play, Square, Database, Check, Cpu } from "lucide-react";
import { useStore } from "../store";
import { getEvent, eventsInRegion } from "../data/flood";
import { sourceCounts } from "../data/sources";

const REGION_TABS: { id: string; label: string; country: "Ghana" | "Cameroon" }[] = [
  { id: "lowerVolta", label: "Lower Volta", country: "Ghana" },
  { id: "whiteVolta", label: "White Volta", country: "Ghana" },
  { id: "farNorth", label: "Far North", country: "Cameroon" },
  { id: "douala", label: "Douala", country: "Cameroon" },
];

export default function ContextBar() {
  const { eventId, mode, setMode, setEvent, setHistoryOpen, setSourcesOpen, setModelOpen, demoRunning, setDemoRunning, stepIndex } = useStore();
  const event = getEvent(eventId);
  const [regionOpen, setRegionOpen] = useState(false);
  const counts = sourceCounts();

  const currentRegion = REGION_TABS.find((r) => r.id === event.regionId) ?? REGION_TABS[0];
  const switchRegion = (rid: string) => {
    setRegionOpen(false);
    if (rid === event.regionId) return;
    const evs = eventsInRegion(rid);
    setEvent(evs[evs.length - 1].id);
  };

  const day = mode === "observed" ? event.steps[stepIndex]?.day : undefined;

  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-surface px-4 text-sm">
      {/* region */}
      <div className="relative shrink-0">
        <button onClick={() => setRegionOpen((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-field px-3 font-medium text-ink hover:bg-hover">
          <span className="text-[13px]">{currentRegion.country} <span className="text-faint">/</span> {currentRegion.label}</span>
          <ChevronDown size={14} className="text-faint" />
        </button>
        {regionOpen && (
          <div className="panel-surface absolute left-0 top-full z-40 mt-1.5 w-60 overflow-hidden p-1">
            {(["Ghana", "Cameroon"] as const).map((country) => (
              <div key={country}>
                <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{country}</div>
                {REGION_TABS.filter((r) => r.country === country).map((r) => (
                  <button key={r.id} onClick={() => switchRegion(r.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] ${r.id === event.regionId ? "text-action" : "text-ink hover:bg-hover"}`}>
                    <span className="flex-1">{r.label}</span>
                    {r.id === event.regionId && <Check size={13} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* mode — the core narrative switch of the demo, so it is labelled, not a bare toggle */}
      <div className="flex h-9 shrink-0 items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-field p-0.5">
        <ModeBtn active={mode === "observed"} onClick={() => setMode("observed")} icon={HistoryIcon} label="History" hint="What happened" />
        <ModeBtn active={mode === "forecast"} onClick={() => setMode("forecast")} icon={Radar} label="Forecast" hint="What could happen" />
      </div>

      <div className="min-w-0 flex-1 truncate text-[12px] text-faint">
        {mode === "observed" ? (
          <button onClick={() => setHistoryOpen(true)} className="truncate text-muted transition-colors hover:text-ink">
            Reconstructed event · <span className="mono text-ink">{day ?? event.meta.startTime}</span>
          </button>
        ) : (
          <span className="truncate">Modeled outlook · ~48 h lead · ordinal index, not a probability</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <BarBtn onClick={() => setModelOpen(true)} icon={Cpu} label="Model" highlight />
        <BarBtn onClick={() => setSourcesOpen(true)} icon={Database} label="Sources" badge={String(counts.real)} />
        <button
          onClick={() => setDemoRunning(!demoRunning)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${demoRunning ? "border-danger/30 bg-danger/15 text-danger" : "border-action/25 bg-action/12 text-action hover:bg-action/20"}`}
        >
          {demoRunning ? <Square size={11} /> : <Play size={12} />} <span className="max-md:hidden">{demoRunning ? "Stop" : "Demo"}</span>
        </button>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, icon: Icon, label, hint }: { active: boolean; onClick: () => void; icon: typeof Radar; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      title={hint}
      className={`flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12px] font-medium transition-colors ${active ? "bg-raised text-ink shadow-[0_1px_2px_rgba(0,0,0,.3)]" : "text-faint hover:text-muted"}`}
    >
      <Icon size={13} className={active ? "text-action" : ""} />
      {label}
      <span className={`ml-0.5 hidden text-[10px] font-normal lg:inline ${active ? "text-muted" : "text-faint/70"}`}>· {hint}</span>
    </button>
  );
}

function BarBtn({ onClick, icon: Icon, label, badge, highlight }: { onClick: () => void; icon: typeof Database; label: string; badge?: string; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${highlight ? "border-[var(--color-border-strong)] bg-raised text-ink hover:bg-hover" : "border-[var(--color-border)] bg-field text-muted hover:bg-hover hover:text-ink"}`}
    >
      <Icon size={12} /> <span className="max-md:hidden">{label}</span>
      {badge && <span className="mono text-success">{badge}</span>}
    </button>
  );
}
