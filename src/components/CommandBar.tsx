import { useState } from "react";
import { Waves, Bell, Circle, Search, Play, Square, Download, Database, MapPin } from "lucide-react";
import { useStore } from "../store";
import { sourceCounts } from "../data/sources";
import { ALL_COMMUNITIES } from "../data/regions";
import { eventsInRegion, getEvent } from "../data/flood";

function Dot({ color = "#31C48D" }: { color?: string }) {
  return <Circle size={7} fill={color} color={color} />;
}

export default function CommandBar() {
  const { mode, setMode, setSourcesOpen, demoRunning, setDemoRunning, selectCommunity, setEvent } = useStore();
  const counts = sourceCounts();
  const [q, setQ] = useState("");
  const results = q.trim().length >= 2 ? ALL_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  const jumpTo = (id: string) => {
    const regionId = id.startsWith("FN") ? "farNorth" : id.startsWith("DL") ? "douala" : id.startsWith("WV") ? "whiteVolta" : id.startsWith("LV") ? "lowerVolta" : "lowerVolta";
    if (getEvent(useStore.getState().eventId).regionId !== regionId) {
      const evs = eventsInRegion(regionId);
      setEvent(evs[evs.length - 1].id);
    }
    selectCommunity(id);
    setQ("");
  };
  return (
    <header className="h-[58px] shrink-0 flex items-center gap-4 px-4 bg-panel border-b border-white/10 z-30">
      <div className="flex items-center gap-2 shrink-0">
        <Waves size={20} className="text-cyan" />
        <span className="font-semibold tracking-tight text-[15px]">FLOODOPS AI</span>
        <span className="label hidden xl:block border-l border-white/10 pl-3 ml-1">Disaster Intelligence from Orbit</span>
      </div>

      {/* observed / forecast mode — never merged (doctrine §3.3) */}
      <div className="flex items-center gap-1 bg-elevated rounded-lg p-1 border border-white/10">
        <button onClick={() => setMode("observed")} className={`px-3 py-1 rounded-md text-xs font-medium ${mode === "observed" ? "bg-hover text-low" : "text-muted hover:text-ink"}`}>Observed</button>
        <button onClick={() => setMode("forecast")} className={`px-3 py-1 rounded-md text-xs font-medium ${mode === "forecast" ? "bg-hover text-cyan" : "text-muted hover:text-ink"}`}>Forecast</button>
      </div>

      <div className="flex-1 max-w-md mx-auto relative">
        <div className="flex items-center gap-2 bg-elevated border border-white/10 rounded-lg px-3 h-9 text-muted focus-within:border-cyan/50">
          <Search size={15} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) jumpTo(results[0].id); if (e.key === "Escape") setQ(""); }}
            placeholder="Search communities…"
            className="bg-transparent outline-none text-sm text-ink placeholder:text-faint w-full"
          />
        </div>
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-panel border border-white/10 rounded-lg overflow-hidden shadow-2xl z-40">
            {results.map((c) => (
              <button key={c.id} onClick={() => jumpTo(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm">
                <MapPin size={13} className="text-cyan shrink-0" />
                <span className="text-ink">{c.name}</span>
                <span className="text-[10px] text-faint ml-auto truncate">{c.admin2 !== "—" ? `${c.admin2}, ` : ""}{c.admin1}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden 2xl:flex items-center gap-2.5 mono text-[10px] text-muted mr-1">
          <span className="flex items-center gap-1"><Dot /> S1</span>
          <span className="flex items-center gap-1"><Dot color="#42C8E8" /> GFM</span>
          <span className="text-faint">OBS <span className="text-ink">2023-10-09</span></span>
        </div>
        <button onClick={() => setDemoRunning(!demoRunning)} className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border ${demoRunning ? "bg-critical/20 text-critical border-critical/30" : "bg-cyan/15 text-cyan hover:bg-cyan/25 border-cyan/20"}`}>
          {demoRunning ? <Square size={13} /> : <Play size={14} />} {demoRunning ? "Stop" : "Start Demo"}
        </button>
        <button onClick={() => setSourcesOpen(true)} title="Source confidence & provenance" className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-elevated hover:bg-hover text-xs font-medium border border-white/10">
          <Database size={14} /> Sources <span className="mono text-[10px] text-low">{counts.real}</span>
        </button>
        <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-elevated hover:bg-hover text-xs font-medium border border-white/10"><Download size={14} /> Brief</button>
        <Bell size={16} className="text-muted hover:text-ink cursor-pointer" />
        <div className="w-8 h-8 rounded-full bg-elevated border border-white/10 flex items-center justify-center text-[11px] font-medium">JD</div>
      </div>
    </header>
  );
}
