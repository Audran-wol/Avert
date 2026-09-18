import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useStore } from "./store";
import { fetchRainSnapshot } from "./services/weather";
import { warmCaches } from "./services/exposure";
import CommandBar from "./components/CommandBar";
import NavRail from "./components/NavRail";
import LeftPanel from "./components/LeftPanel";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import FloatingCommunityCard from "./components/FloatingCommunityCard";
import TimelinePlayer from "./components/TimelinePlayer";
import SourceConfidence from "./components/SourceConfidence";
import HistoryPanel from "./components/HistoryPanel";
import DemoMode from "./components/DemoMode";

export default function App() {
  const panelOpen = useStore((s) => s.panelOpen);
  const setPanelOpen = useStore((s) => s.setPanelOpen);
  const [weatherReady, setWeatherReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchRainSnapshot("lowerVolta").catch(() => undefined),
      fetchRainSnapshot("whiteVolta").catch(() => undefined),
      fetchRainSnapshot("farNorth").catch(() => undefined),
      fetchRainSnapshot("douala").catch(() => undefined),
    ]).finally(() => {
      if (active) setWeatherReady(true);
    });
    warmCaches(); // precompute exposure/road caches off the interaction path
    return () => { active = false; };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <CommandBar />
      <div className="flex-1 flex min-h-0">
        <NavRail />
        <AnimatePresence initial={false} mode="wait">
          {panelOpen ? (
            <motion.div key="left-panel" initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden shrink-0">
              <LeftPanel />
            </motion.div>
          ) : (
            <motion.button key="show-panel" type="button" initial={{ width: 0, opacity: 0 }} animate={{ width: 28, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }} onClick={() => setPanelOpen(true)} className="w-7 shrink-0 bg-panel border-r border-white/10 text-paper-sub hover:text-paper-ink flex items-center justify-center z-20">
              <ChevronRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        <main className="relative flex-1 min-w-0">
          <MapView />
          <FloatingCommunityCard />
          <MapControls />
          <TimelinePlayer />
          <SourceConfidence />
          <HistoryPanel />
          <DemoMode />
          <div className="absolute bottom-2.5 left-3 z-10 text-[9px] text-white/45 max-w-[220px] pointer-events-none">
            Prototype disaster-intelligence platform · demonstration &amp; modeled data · estimates require ground verification
          </div>
          {!weatherReady && <div className="absolute right-3 top-3 z-20 rounded-full border border-cyan/30 bg-[#07141c]/80 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-cyan">loading rainfall</div>}
        </main>
      </div>
    </div>
  );
}
