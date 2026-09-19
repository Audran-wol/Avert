import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Cpu, Database, Mountain, Layers3, ListOrdered, Check, Play, Loader2 } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion, ALL_COMMUNITIES } from "../data/regions";
import { susceptibilityFor } from "../data/features";
import { computeForecastRisk, forecastRanking } from "../services/forecast";
import { computeStep, communityById } from "../services/exposure";
import { SOURCES } from "../data/sources";

interface Stage {
  id: string;
  icon: typeof Database;
  title: string;
  detail: string;
  metric: string;
}

export default function ModelPanel() {
  const { modelOpen, setModelOpen, eventId, mode, stepIndex, selectedId } = useStore();
  const event = getEvent(eventId);
  const region = getRegion(event.regionId);

  const [stageDone, setStageDone] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const liveSources = SOURCES.filter((s) => s.status === "real").length;
  const featureCount = region.communities.filter((c) => susceptibilityFor(c.id)).length;

  const stages: Stage[] = [
    { id: "ingest", icon: Database, title: "Ingest", detail: "OpenStreetMap settlements, rivers, roads · geoBoundaries districts · GDACS event record", metric: `${liveSources} live sources` },
    { id: "terrain", icon: Mountain, title: "Terrain features", detail: "SRTM 30 m elevation → HAND, distance-to-drainage, prior-inundation flag", metric: `${featureCount} × 4 features` },
    { id: "susceptibility", icon: Layers3, title: "Baseline susceptibility", detail: "Interpretable weighted index over terrain features — how flood-prone a place is, always", metric: "susceptibility-0.1" },
    { id: "blend", icon: Cpu, title: "Hazard blend", detail: mode === "forecast" ? "index = susceptibility × (0.4 + 0.6 · hazard) — live Open-Meteo rainfall + historical recurrence" : "Flood extent ∩ settlements → exposure, road-cut and depth band per community", metric: mode === "forecast" ? "forecast-0.2" : "priority-0.1" },
    { id: "rank", icon: ListOrdered, title: "Ranked output", detail: "Scored communities ordered for response, every figure carrying its evidence state", metric: `${region.communities.length} communities` },
  ];

  // The "run" is a real recomputation of the live pipeline — the timings shown are measured,
  // not scripted. Stages reveal progressively so the flow is legible while demoing.
  const run = () => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setStageDone(-1);

    const t0 = performance.now();
    if (mode === "forecast") forecastRanking(region.communities);
    else computeStep(eventId, stepIndex);
    const elapsed = performance.now() - t0;

    stages.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => {
        setStageDone(i);
        if (i === stages.length - 1) { setRunning(false); setLastRunMs(Math.max(1, Math.round(elapsed))); }
      }, 260 * (i + 1)));
    });
  };

  useEffect(() => {
    if (modelOpen && stageDone < 0 && !running) run();
    if (!modelOpen) { timers.current.forEach(clearTimeout); timers.current = []; }
    return () => { timers.current.forEach(clearTimeout); };
  }, [modelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const community = selectedId ? communityById(selectedId) : undefined;
  const risk = community && mode === "forecast" ? computeForecastRisk(community.id) : null;
  const prio = community && mode === "observed" ? computeStep(eventId, stepIndex).priorities.find((p) => p.communityId === community.id) : null;
  const factors = risk?.factors ?? prio?.factors ?? [];
  const maxContribution = Math.max(1, ...factors.map((f) => f.contribution));

  return (
    <AnimatePresence>
      {modelOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModelOpen(false)} className="absolute inset-0 z-40 bg-black/55 backdrop-blur-[2px]" />
          <motion.aside
            initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: "tween", duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 right-0 top-0 z-40 flex w-[440px] max-w-full flex-col border-l border-[var(--color-border)] bg-surface"
          >
            <header className="flex shrink-0 items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-action/15 text-action"><Cpu size={16} /></span>
                <div>
                  <div className="text-[15px] font-semibold leading-tight text-ink">Intelligence pipeline</div>
                  <div className="text-[11px] text-faint">How Avert turns raw geodata into a ranked response list</div>
                </div>
              </div>
              <button onClick={() => setModelOpen(false)} className="text-faint transition-colors hover:text-ink"><X size={18} /></button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{mode === "forecast" ? "Forecast path" : "History path"}</span>
                <button onClick={run} disabled={running} className="flex h-7 items-center gap-1.5 rounded-lg border border-action/25 bg-action/12 px-2.5 text-[11px] font-medium text-action transition-colors hover:bg-action/20 disabled:opacity-60">
                  {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={11} />} {running ? "Running" : "Re-run"}
                </button>
              </div>

              {/* pipeline */}
              <ol className="relative space-y-1">
                <span className="absolute bottom-4 left-[15px] top-4 w-px bg-[var(--color-border)]" aria-hidden="true" />
                {stages.map((s, i) => {
                  const done = stageDone >= i;
                  const active = running && stageDone === i - 1;
                  return (
                    <li key={s.id} className="relative flex gap-3 rounded-xl px-1 py-2">
                      <span className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${done ? "border-success/40 bg-success/15 text-success" : active ? "border-action/40 bg-action/15 text-action" : "border-[var(--color-border)] bg-field text-faint"}`}>
                        {done ? <Check size={14} /> : active ? <Loader2 size={13} className="animate-spin" /> : <s.icon size={14} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`text-[13px] font-medium ${done || active ? "text-ink" : "text-faint"}`}>{s.title}</span>
                          <span className="mono shrink-0 text-[10px] text-faint">{s.metric}</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{s.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>

              {lastRunMs !== null && !running && (
                <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-field px-3 py-2 text-[11px] text-muted">
                  Pipeline recomputed over <span className="mono text-ink">{region.communities.length}</span> communities in <span className="mono text-success">{lastRunMs} ms</span> — measured on this device, in the browser.
                </div>
              )}

              {/* live feature attribution for the selected community */}
              <div className="mt-6">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">Feature attribution</div>
                {community && factors.length > 0 ? (
                  <div className="panel-surface p-3.5">
                    <div className="mb-2.5 flex items-baseline justify-between">
                      <span className="text-[13px] font-medium text-ink">{community.name}</span>
                      <span className="mono text-[13px] font-semibold text-action">{risk?.index ?? prio?.score}<span className="text-[10px] text-faint">/100</span></span>
                    </div>
                    <div className="space-y-2">
                      {factors.map((f) => (
                        <div key={f.code}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[11px] text-muted">{f.label}</span>
                            <span className="mono shrink-0 text-[11px] text-ink">+{f.contribution}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(f.contribution / maxContribution) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-action" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-5 text-center text-[11px] text-faint">
                    Select a community to see which features drove its score.
                  </div>
                )}
              </div>

              {/* honest model card */}
              <div className="mt-6">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">Model card</div>
                <div className="panel-surface divide-y divide-[var(--color-border)]">
                  <Row k="Method" v="Interpretable weighted index" />
                  <Row k="Version" v={mode === "forecast" ? "forecast-0.2" : "priority-0.1"} mono />
                  <Row k="Training" v="Not a trained network — weights are expert-set and auditable" />
                  <Row k="Calibration" v="Ordinal index, not a probability" />
                  <Row k="Coverage" v={`${ALL_COMMUNITIES.length} communities · Ghana + Cameroon`} />
                </div>
                <p className="mt-2.5 text-[10.5px] leading-relaxed text-faint">
                  Every score here is reproducible and explainable: the same inputs always yield the same
                  output, and each factor above is traceable to a named source. Learned models over the
                  historical flood record are the next step, not a claim we make today.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <span className="shrink-0 text-[11px] text-faint">{k}</span>
      <span className={`text-right text-[11px] text-ink ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}
