import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, Pause } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { computeStep } from "../services/exposure";

export default function TimelinePlayer() {
  const { eventId, stepIndex, playing, setStep, setPlaying, mode } = useStore();
  const event = getEvent(eventId);
  const steps = event.steps;
  const lastStep = steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const s = useStore.getState();
      const last = getEvent(s.eventId).steps.length - 1;
      if (s.stepIndex >= last) s.setPlaying(false);
      else s.setStep(s.stepIndex + 1);
    }, 950);
    return () => clearInterval(t);
  }, [playing]);

  const { snapshots } = computeStep(eventId, stepIndex);
  const inundated = [...snapshots.values()].filter((s) => s.floodStatus === "inundated").length;
  const exposed = [...snapshots.values()].reduce((a, s) => a + (s.populationExposed?.value ?? 0), 0);
  const step = steps[stepIndex];
  const caption = event.captions[stepIndex];

  const toggle = () => {
    if (stepIndex >= lastStep && !playing) setStep(0);
    setPlaying(!playing);
  };

  if (mode === "forecast") return null; // no event timeline in forecast

  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[600px] max-w-[calc(100%-2rem)] -translate-x-1/2">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="glass-panel mx-auto mb-2 w-fit max-w-full px-3 py-1.5"
          >
            <span className="mono mr-2 text-[10px] text-faint">{step.day}</span>
            <span className="text-[12px] text-ink">{caption}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause playback" : "Play flood timeline"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-action text-white transition-opacity hover:opacity-90"
        >
          {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
        </button>

        <div className="flex flex-1 items-end gap-1">
          {steps.map((s, i) => {
            const on = i <= stepIndex;
            const current = i === stepIndex;
            return (
              <button
                key={s.day}
                onClick={() => { setPlaying(false); setStep(i); }}
                title={s.day}
                className="group flex flex-1 flex-col items-center gap-1.5"
              >
                <span
                  className="w-full rounded-full transition-all"
                  style={{
                    height: current ? 6 : 3,
                    background: on ? "var(--color-action)" : "rgba(255,255,255,0.13)",
                    opacity: on && !current ? 0.55 : 1,
                  }}
                />
                <span className={`mono text-[9px] transition-colors ${current ? "text-ink" : "text-faint/70 group-hover:text-muted"}`}>
                  {current ? s.day.slice(5) : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mono flex shrink-0 items-center gap-3 border-l border-[var(--color-border)] pl-3 text-[11px]">
          <span className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-[0.08em] text-faint">Flooded</span>
            <span className="text-ink">{inundated}</span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-[0.08em] text-faint">Exposed</span>
            <span className="text-flood">≈{(exposed / 1000).toFixed(1)}k</span>
          </span>
        </div>
      </div>
    </div>
  );
}
