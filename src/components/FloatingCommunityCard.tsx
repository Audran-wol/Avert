import { AnimatePresence, motion } from "motion/react";
import { X, Droplets, Route, Home, Users } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { computeStep, communityById } from "../services/exposure";
import { computeForecastRisk } from "../services/forecast";
import { susceptibilityFor } from "../data/features";
import { getForecastHazard } from "../data/conditions";
import { photoFor } from "../data/photos";
import { PRIORITY_COLOR, SUSC_COLOR, RISK_CLASS_COLOR, type FloodStatus, type Community } from "../models/contracts";
import { Evidence } from "./Evidence";
import AnimatedNumber from "./AnimatedNumber";

const STATUS: Record<FloodStatus, { label: string; color: string }> = {
  inundated: { label: "INUNDATED", color: "#EE4B4B" },
  partial: { label: "PARTIAL", color: "#F28A35" },
  "at-risk": { label: "AT RISK", color: "#E3B341" },
  safe: { label: "SAFE", color: "#31C48D" },
};

export default function FloatingCommunityCard() {
  const selectedId = useStore((s) => s.selectedId);
  const c = selectedId ? communityById(selectedId) : undefined;
  return (
    <AnimatePresence>
      {c && (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-4 right-4 w-[340px] max-h-[calc(100%-7rem)] overflow-y-auto z-10 bg-paper-card text-paper-ink rounded-2xl shadow-2xl border border-black/[0.06]"
        >
          <Body c={c} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Body({ c }: { c: Community }) {
  const { eventId, stepIndex, selectCommunity, mode } = useStore();
  const status = computeStep(eventId, stepIndex).snapshots.get(c.id)?.floodStatus;
  const flooded = status === "inundated" || status === "partial" || status === "at-risk";
  // observed: exact town photo, else a representative basin photo when flooded. forecast: exact only.
  const photo = mode === "observed" ? photoFor(c.name, getEvent(eventId).regionId, flooded) : photoFor(c.name, getEvent(eventId).regionId, false);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-semibold">{c.name}</div>
          <div className="text-xs text-paper-sub">{c.admin2}, {c.admin1}</div>
        </div>
        <button onClick={() => selectCommunity(null)} className="text-paper-faint hover:text-paper-ink"><X size={18} /></button>
      </div>

      {photo && (
        <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.06] bg-paper-muted">
          <img src={photo.url} alt={`${c.name} flood`} loading="lazy" className="h-32 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[9px] text-paper-faint">
            <span>{photo.credit}</span>
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan hover:underline">source</a>
          </div>
          <div className="px-2 pb-2 text-[8px] text-paper-sub">License: {photo.license}{photo.note ? ` · ${photo.note}` : ""}</div>
        </div>
      )}

      {mode === "observed" ? <ObservedView c={c} eventId={eventId} stepIndex={stepIndex} /> : <ForecastView c={c} />}

      {/* shared: baseline susceptibility (static) */}
      <SusceptibilityBlock communityId={c.id} />

      <div className="flex items-center gap-2 mt-3 text-[9px] text-paper-faint">
        <span className="text-low">✓ OBSERVED</span>
        <span className="text-moderate">✓ INFERRED</span>
        <span className="text-high">✓ ASSESSED</span>
        <span>{mode === "forecast" ? "✓ FORECAST" : "○ UNVERIFIED"}</span>
      </div>
    </div>
  );
}

function ObservedView({ c, eventId, stepIndex }: { c: Community; eventId: string; stepIndex: number }) {
  const { snapshots, priorities } = computeStep(eventId, stepIndex);
  const snap = snapshots.get(c.id);
  const prio = priorities.find((p) => p.communityId === c.id);
  if (!snap || !prio) return null; // community not in the current event's region (transition)
  const st = STATUS[snap.floodStatus];
  const col = PRIORITY_COLOR[prio.level];
  const day = getEvent(eventId).steps[stepIndex].day;

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: `${st.color}1f`, color: st.color }}>{st.label}</span>
        <span className="text-[11px] text-paper-sub mono">as of {day}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[44px] leading-none font-semibold mono" style={{ color: col }}><AnimatedNumber value={prio.score} format={(v) => String(Math.round(v))} /></div>
          <div className="label-dark mt-1">Response Priority · {prio.level}</div>
        </div>
        <div className="text-right text-[10px] text-paper-faint">confidence<br /><span className="mono text-paper-ink text-sm">{Math.round(prio.confidence * 100)}%</span></div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Row icon={Users} label="People exposed" value={snap.populationExposed ? `≈${(snap.populationExposed.value / 1000).toFixed(1)}k${snap.populationExposed.range ? ` (${(snap.populationExposed.range[0] / 1000).toFixed(1)}–${(snap.populationExposed.range[1] / 1000).toFixed(1)}k)` : ""}` : "—"} ev={snap.populationExposed?.evidence} />
        <Row icon={Droplets} label="Est. water depth" value={snap.depthBand?.value ?? "—"} ev={snap.depthBand?.evidence} />
        <Row icon={Route} label="Road access" value={roadLabel(snap.roadStatus.value)} ev={snap.roadStatus.evidence} />
        <Row icon={Home} label="Nearest safe town" value={snap.nearestShelterKm ? `${snap.nearestShelterKm.value} km` : "—"} ev={snap.nearestShelterKm?.evidence} />
        <Row icon={Users} label="Community population" value={c.population ? `≈${(c.population.value / 1000).toFixed(1)}k` : "—"} ev={c.population?.evidence} />
      </div>

      <div className="label-dark mt-4 mb-1.5">Why this priority</div>
      <div className="space-y-1.5">
        {prio.factors.map((f) => (
          <div key={f.code} className="flex items-start gap-2.5">
            <span className="mono text-sm font-semibold w-7 shrink-0" style={{ color: col }}>+{f.contribution}</span>
            <span className="flex-1"><span className="text-xs block">{f.label}</span>{f.detail && <span className="text-[10px] text-paper-faint">{f.detail}</span>}</span>
            {f.evidence && <Evidence ev={f.evidence} />}
          </div>
        ))}
        {prio.factors.length === 0 && <div className="text-[11px] text-paper-faint">Outside modeled flood extent at this timestep.</div>}
      </div>

      <div className="mt-3 bg-paper-ink text-white rounded-xl p-3">
        <div className="text-[10px] font-semibold text-cyan mb-1">FLOOD INTELLIGENCE</div>
        <p className="text-[11px] leading-relaxed text-white/85">{insight(c.name, snap, prio.score)}</p>
      </div>
    </>
  );
}

function ForecastView({ c }: { c: Community }) {
  const risk = computeForecastRisk(c.id);
  const hazard = getForecastHazard(
    c.id.startsWith("FN") ? "farNorth" : c.id.startsWith("DL") ? "douala" : c.id.startsWith("WV") ? "whiteVolta" : "lowerVolta",
  );
  if (!risk) return <div className="text-[11px] text-paper-faint mt-3">No terrain features for this community.</div>;
  const col = RISK_CLASS_COLOR[risk.class];

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase" style={{ background: `${col}1f`, color: col }}>{risk.class} risk</span>
        <span className="text-[11px] text-paper-sub mono">lead ~{risk.leadHours}h</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[44px] leading-none font-semibold mono" style={{ color: col }}><AnimatedNumber value={risk.index} format={(v) => String(Math.round(v))} /></div>
          <div className="label-dark mt-1">Next-flood risk index · {risk.class}</div>
        </div>
        <div className="text-right text-[10px] text-paper-faint">confidence<br /><span className="mono text-paper-ink text-sm">{Math.round(risk.confidence * 100)}%</span></div>
      </div>

      {/* pattern match to the historical flood driver pattern */}
      <div className="mt-3 rounded-xl border border-cyan/20 bg-cyan/[0.06] p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#1c6fae]">Pattern match · {hazard.scenario}</span>
          <span className="mono text-sm font-semibold text-[#1c6fae]">{Math.round(risk.patternMatch * 100)}%</span>
        </div>
        {hazard.matches.map((m) => (
          <div key={m.label} className="flex items-center gap-2 py-0.5 text-[11px]">
            <span className="text-low">{m.matched ? "✓" : "○"}</span>
            <span className="flex-1 min-w-0"><span className="block">{m.label}</span><span className="text-[9px] text-paper-faint">{m.detail}</span></span>
            <Evidence ev={m.evidence} />
          </div>
        ))}
      </div>

      <div className="label-dark mt-4 mb-1.5">Why this risk</div>
      <div className="space-y-1.5">
        {risk.factors.map((f) => (
          <div key={f.code} className="flex items-start gap-2.5">
            <span className="mono text-sm font-semibold w-7 shrink-0" style={{ color: col }}>+{f.contribution}</span>
            <span className="flex-1"><span className="text-xs block">{f.label}</span>{f.detail && <span className="text-[10px] text-paper-faint">{f.detail}</span>}</span>
            {f.evidence && <Evidence ev={f.evidence} />}
          </div>
        ))}
      </div>

      <div className="mt-3 bg-paper-ink text-white rounded-xl p-3">
        <div className="text-[10px] font-semibold text-cyan mb-1">FORECAST INTELLIGENCE</div>
        <p className="text-[11px] leading-relaxed text-white/85">
          If conditions resemble the historical flood pattern for this basin, {c.name} carries {risk.class.toUpperCase()} next-flood risk (index {risk.index}, ~{risk.leadHours}h lead). Ordinal index — not a calibrated probability. Verify against dam-release schedules and live GloFAS/rainfall forecasts.
        </p>
      </div>
    </>
  );
}

function SusceptibilityBlock({ communityId }: { communityId: string }) {
  const s = susceptibilityFor(communityId);
  if (!s) return null;
  const col = SUSC_COLOR[s.class];
  return (
    <>
      <div className="flex items-center justify-between mt-4 mb-1.5">
        <span className="label-dark">Baseline susceptibility</span>
        <Evidence ev={s.evidence} />
      </div>
      <div className="bg-paper/70 rounded-lg p-2.5 border border-black/[0.04]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase" style={{ background: `${col}1f`, color: col }}>{s.class.replace("-", " ")}</span>
          <span className="mono text-sm font-semibold" style={{ color: col }}>{s.index}<span className="text-paper-faint text-[10px]">/100</span></span>
        </div>
        <div className="h-1.5 rounded-full bg-paper-muted mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.index}%`, background: col }} /></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
          <Kv2 label="HAND" value={`${s.features.handM} m`} />
          <Kv2 label="Elevation" value={`${s.features.elevM} m`} />
          <Kv2 label="Dist. to river" value={`${s.features.distRiverM} m`} />
          <Kv2 label="Flooded 2023" value={s.features.floodedBefore ? "Yes" : "No"} />
        </div>
        <div className="text-[9px] text-paper-faint mt-1.5">How flood-prone this location is, independent of any event. Index, not a probability.</div>
      </div>
    </>
  );
}

function Kv2({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-paper-sub">{label}</span><span className="mono font-medium">{value}</span></div>;
}

function roadLabel(v: string) {
  return v === "road-cut" ? "Likely cut" : v === "restricted" ? "Restricted" : v === "accessible" ? "Accessible" : "Unknown";
}
function insight(name: string, snap: any, score: number) {
  if (snap.floodStatus === "safe") return `${name} lies outside the modeled flood extent at this timestep and is a candidate staging point. Monitoring only.`;
  const cut = snap.roadStatus.value === "road-cut" ? " Primary road access appears cut, so alternate routing may be required." : "";
  return `${name} intersects the modeled flood extent with an estimated ${snap.depthBand?.value ?? "shallow"} depth and ≈${((snap.populationExposed?.value ?? 0) / 1000).toFixed(1)}k people exposed.${cut} Response priority ${score}. Figures are modeled estimates — field verification recommended.`;
}

function Row({ icon: Icon, label, value, ev }: { icon: typeof Users; label: string; value: string; ev?: any }) {
  return (
    <div className="flex items-center gap-2 bg-paper/70 rounded-lg px-2.5 py-1.5 border border-black/[0.04]">
      <Icon size={14} className="text-[#2b8fd6] shrink-0" />
      <span className="text-[11px] text-paper-sub flex-1 min-w-0 truncate">{label}</span>
      <span className="mono text-xs font-medium">{value}</span>
      {ev && <Evidence ev={ev} />}
    </div>
  );
}
