import { AnimatePresence, motion } from "motion/react";
import { X, Database } from "lucide-react";
import { useStore } from "../store";
import { SOURCES, INTEGRATION_COLOR, INTEGRATION_LABEL, sourceCounts, type Integration } from "../data/sources";

const ORDER: Integration[] = ["real", "curated", "modeled", "planned"];

export default function SourceConfidence() {
  const { sourcesOpen, setSourcesOpen } = useStore();
  const counts = sourceCounts();
  return (
    <AnimatePresence>
      {sourcesOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSourcesOpen(false)} className="absolute inset-0 z-40 bg-black/40" />
          <motion.aside
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: "tween", duration: 0.28 }}
            className="absolute top-0 right-0 bottom-0 w-[380px] z-40 bg-panel border-l border-white/10 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 h-[58px] border-b border-white/10 sticky top-0 bg-panel z-10">
              <div className="flex items-center gap-2"><Database size={16} className="text-cyan" /><span className="font-semibold text-sm">Source Confidence</span></div>
              <button onClick={() => setSourcesOpen(false)} className="text-faint hover:text-ink"><X size={18} /></button>
            </div>

            <div className="p-4">
              <p className="text-[11px] text-muted leading-relaxed mb-3">
                Every value in FloodOps is traceable. This registry shows exactly what is fetched live, what is a cited real value, what FloodOps models, and what is planned.
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {ORDER.map((k) => (
                  <div key={k} className="bg-elevated rounded-lg p-2 text-center border border-white/5">
                    <div className="mono text-lg font-semibold" style={{ color: INTEGRATION_COLOR[k] }}>{counts[k]}</div>
                    <div className="text-[8px] uppercase tracking-wide text-faint mt-0.5">{k}</div>
                  </div>
                ))}
              </div>

              {ORDER.map((status) => {
                const rows = SOURCES.filter((s) => s.status === status);
                if (!rows.length) return null;
                return (
                  <div key={status} className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: INTEGRATION_COLOR[status] }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: INTEGRATION_COLOR[status] }}>{INTEGRATION_LABEL[status]}</span>
                    </div>
                    <div className="space-y-1.5">
                      {rows.map((s) => (
                        <div key={s.id} className="bg-elevated/60 rounded-lg p-2.5 border border-white/5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{s.name}</span>
                            <span className="mono text-[9px] text-faint shrink-0">{s.id}</span>
                          </div>
                          <div className="text-[10px] text-muted mt-0.5">{s.role}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-semibold px-1 py-[1px] rounded" style={{ background: `${INTEGRATION_COLOR[status]}26`, color: INTEGRATION_COLOR[status] }}>{s.state}</span>
                            <span className="text-[9px] text-faint">{s.group}</span>
                          </div>
                          {s.note && <div className="text-[9px] text-faint mt-1 italic">{s.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-faint mt-2">Doctrine: observation, forecast, inference, assessment and reported figures are kept separate (Transition/00). Modeled values are never presented as observed.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
