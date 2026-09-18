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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[620px] max-w-[calc(100%-2rem)]">
      <AnimatePresence>
        {caption && (
          <motion.div key={caption} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mb-2 mx-auto w-fit px-3 py-1.5 rounded-lg bg-panel/95 backdrop-blur border border-white/10 text-xs">
            <span className="mono text-faint mr-2">{step.day}</span>
            <span className="text-cyan">{caption}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 bg-panel/95 backdrop-blur border border-white/10 rounded-xl px-3 py-2.5">
        <button onClick={toggle} className="w-9 h-9 shrink-0 rounded-lg bg-cyan/15 text-cyan hover:bg-cyan/25 border border-cyan/20 flex items-center justify-center">
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="flex-1 flex items-center gap-1">
          {steps.map((s, i) => {
            const on = i <= stepIndex;
            return (
              <button key={s.day} onClick={() => { setPlaying(false); setStep(i); }} className="flex-1 flex flex-col items-center gap-1">
                <span className="w-full h-1 rounded-full" style={{ background: on ? "#2b8fd6" : "rgba(255,255,255,0.14)" }} />
                <span className={`text-[9px] mono ${i === stepIndex ? "text-ink" : "text-faint"}`}>{s.day.slice(5)}</span>
              </button>
            );
          })}
        </div>
        <div className="shrink-0 flex items-center gap-3 pl-2 border-l border-white/10 mono text-xs">
          <span><span className="text-faint">FLOODED </span><span className="text-ink">{inundated}</span></span>
          <span><span className="text-faint">EXPOSED </span><span className="text-[#8fd4ff]">≈{(exposed / 1000).toFixed(1)}k</span></span>
        </div>
      </div>
    </div>
  );
}
