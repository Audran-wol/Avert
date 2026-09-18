import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";

const last = (id: string) => getEvent(id).steps.length - 1;
const commId = (regionId: string, name: string) => getRegion(regionId).communities.find((c) => c.name === name)?.id ?? null;

interface Chapter { n: string; title: string; caption: string; ms: number; run: () => void }

const S = () => useStore.getState();

const CHAPTERS: Chapter[] = [
  {
    n: "01", title: "FloodOps AI", caption: "Disaster intelligence from orbit — Lower Volta, Ghana",
    ms: 3800,
    run: () => { const s = S(); s.setBasemap("streets"); s.setMode("observed"); s.setEvent("2023"); s.selectCommunity(null); s.setStep(0); },
  },
  {
    n: "02", title: "Sep–Oct 2023 · Akosombo spillage", caption: "Controlled dam release floods the Lower Volta, day by day",
    ms: 8200,
    run: () => { const s = S(); s.setStep(0); s.setPlaying(true); },
  },
  {
    n: "03", title: "Who is exposed?", caption: "Sogakope — thousands exposed, road access cut, high response priority",
    ms: 6000,
    run: () => { const s = S(); s.setPlaying(false); s.setStep(last("2023")); s.selectCommunity(commId("lowerVolta", "Sogakope")); },
  },
  {
    n: "04", title: "Could it flood again?", caption: "Forecast — terrain susceptibility × current conditions → next-flood risk",
    ms: 6000,
    run: () => { S().setMode("forecast"); },
  },
  {
    n: "05", title: "A different basin · White Volta 2018", caption: "Same platform, new region and year — flying to the Upper East…",
    ms: 3400,
    run: () => { const s = S(); s.setMode("observed"); s.setEvent("wv2018"); s.setStep(0); },
  },
  {
    n: "06", title: "Bagre Dam spillage · 2018", caption: "Upstream release floods the White Volta across the Upper East",
    ms: 7200,
    run: () => { S().setPlaying(true); },
  },
  {
    n: "07", title: "Learning from history", caption: "The White Volta has flooded 8× since 2007 — HIGH next-flood risk",
    ms: 6800,
    run: () => { const s = S(); s.setPlaying(false); s.setStep(last("wv2018")); s.setMode("forecast"); s.selectCommunity(commId("whiteVolta", "Kpasenkpe")); },
  },
  {
    n: "08", title: "From observation to action", caption: "Satellite → exposure → response priority — every number traceable to its source",
    ms: 5500,
    run: () => { const s = S(); s.setMode("observed"); s.selectCommunity(null); s.setEvent("2023"); },
  },
];

export default function DemoMode() {
  const { demoRunning, setDemoRunning } = useStore();
  const [ch, setCh] = useState(-1);

  useEffect(() => { setCh(demoRunning ? 0 : -1); if (!demoRunning) S().setPlaying(false); }, [demoRunning]);

  useEffect(() => {
    if (!demoRunning || ch < 0) return;
    if (ch >= CHAPTERS.length) { setDemoRunning(false); return; }
    CHAPTERS[ch].run();
    const t = setTimeout(() => setCh((c) => c + 1), CHAPTERS[ch].ms);
    return () => clearTimeout(t);
  }, [ch, demoRunning]);

  const c = ch >= 0 && ch < CHAPTERS.length ? CHAPTERS[ch] : null;

  return (
    <AnimatePresence>
      {demoRunning && c && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[560px] max-w-[calc(100%-2rem)]">
          <div className="bg-panel/95 backdrop-blur border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="mono text-2xl font-semibold text-cyan leading-none">{c.n}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="text-xs text-muted mt-0.5">{c.caption}</div>
              </div>
              <button onClick={() => setDemoRunning(false)} className="text-faint hover:text-ink shrink-0"><X size={16} /></button>
            </div>
            <div className="flex gap-1 mt-3">
              {CHAPTERS.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= ch ? "bg-cyan" : "bg-white/15"}`} />)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
