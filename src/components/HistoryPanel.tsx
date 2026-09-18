import { AnimatePresence, motion } from "motion/react";
import { X, History, CheckCircle2 } from "lucide-react";
import { useStore } from "../store";
import { FLOOD_HISTORY, AOI_RECURRENCE } from "../data/history";
import { Evidence } from "./Evidence";

const MECH_COLOR: Record<string, string> = {
  "dam-release": "#42C8E8", riverine: "#2b8fd6", "urban-pluvial": "#F28A35", flash: "#EE4B4B", coastal: "#31C48D", compound: "#E3B341", unknown: "#667482",
};

export default function HistoryPanel() {
  const { historyOpen, setHistoryOpen, setEvent, eventId } = useStore();
  const events = [...FLOOD_HISTORY].sort((a, b) => b.date.localeCompare(a.date)); // latest first
  const verifiedCount = events.filter((e) => e.verified).length;
  const curatedCount = events.length - verifiedCount;
  return (
    <AnimatePresence>
      {historyOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHistoryOpen(false)} className="absolute inset-0 z-40 bg-black/40" />
          <motion.aside initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} transition={{ type: "tween", duration: 0.28 }} className="absolute top-0 left-0 bottom-0 w-[400px] z-40 bg-panel border-r border-white/10 overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-[58px] border-b border-white/10 sticky top-0 bg-panel z-10">
              <div className="flex items-center gap-2"><History size={16} className="text-cyan" /><span className="font-semibold text-sm">Flood history</span></div>
              <button onClick={() => setHistoryOpen(false)} className="text-faint hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-muted leading-relaxed mb-3">
                The forecast learns from the historical record, not one event. {verifiedCount} entries are source-anchored as verified; {curatedCount} remain curated or context-only and are labeled accordingly.
                <span className="block mt-1 text-faint">Lower Volta has flooded <span className="text-ink mono">{AOI_RECURRENCE.count}×</span> in this record ({AOI_RECURRENCE.years.join(", ")}).</span>
              </p>
              <div className="relative pl-4">
                <span className="absolute left-[5px] top-1 bottom-1 w-px bg-white/10" />
                {events.map((e) => {
                  const loadable = !!e.spatialEventId;
                  const active = e.spatialEventId === eventId;
                  return (
                    <div key={e.id} className="relative mb-3">
                      <span className="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-panel" style={{ background: MECH_COLOR[e.mechanism] }} />
                      <div
                        onClick={() => loadable && setEvent(e.spatialEventId!)}
                        className={`bg-elevated/60 rounded-lg p-2.5 border transition-colors ${active ? "border-cyan/50" : "border-white/5"} ${loadable ? "cursor-pointer hover:bg-hover" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">{e.name}</span>
                          <span className="mono text-[10px] text-faint shrink-0">{e.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] font-semibold px-1.5 py-[1px] rounded uppercase" style={{ background: `${MECH_COLOR[e.mechanism]}26`, color: MECH_COLOR[e.mechanism] }}>{e.mechanism}</span>
                          <span className="text-[9px] text-faint">{e.zones.slice(0, 2).join(" · ")}</span>
                          {e.verified && <span className="flex items-center gap-0.5 text-[9px] text-low"><CheckCircle2 size={10} /> GDACS</span>}
                          {loadable ? <span className="ml-auto text-[9px] font-semibold text-cyan">{active ? "● loaded" : "load on map →"}</span> : <span className="ml-auto text-[9px] text-faint">record only</span>}
                        </div>
                        <div className="text-[10px] text-muted mt-1">{e.impactNote}</div>
                        <div className="mt-1"><Evidence ev={e.evidence} showSource /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-faint mt-2">Full-fidelity record (EM-DAT / ReliefWeb) requires registered access. Spatial footprints per event require satellite reconstruction (planned).</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
