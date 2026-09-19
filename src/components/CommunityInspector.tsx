import { useState } from "react";
import { X, Droplets, Route, Home, Users } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { computeStep, communityById } from "../services/exposure";
import { computeForecastRisk } from "../services/forecast";
import { susceptibilityFor } from "../data/features";
import { getForecastHazard } from "../data/conditions";
import { photoFor } from "../data/photos";
import { PRIORITY_COLOR, SUSC_COLOR, RISK_CLASS_COLOR, type FloodStatus, type Community, type EvidenceRef } from "../models/contracts";
import { Evidence } from "./Evidence";
import AnimatedNumber from "./AnimatedNumber";

const STATUS: Record<FloodStatus, { label: string; color: string }> = {
  inundated: { label: "INUNDATED", color: "#EE4B4B" },
  partial: { label: "PARTIAL", color: "#F28A35" },
  "at-risk": { label: "AT RISK", color: "#E3B341" },
  safe: { label: "SAFE", color: "#31C48D" },
};

export default function CommunityInspector() {
  const selectedId = useStore((s) => s.selectedId);
  const selectCommunity = useStore((s) => s.selectCommunity);
  const [tab, setTab] = useState<"overview" | "evidence">("overview");
  const c = selectedId ? communityById(selectedId) : undefined;
  if (!c) return null;

  return (
    <>
      <div onClick={() => selectCommunity(null)} className="hidden max-[1099px]:block fixed inset-0 z-30 bg-black/50" />
      <aside
        key={c.id}
        className="w-[380px] max-[1439px]:w-[340px] shrink-0 h-full bg-surface border-l border-border flex flex-col overflow-hidden z-20
          max-[1099px]:fixed max-[1099px]:inset-y-0 max-[1099px]:right-0 max-[1099px]:z-40 max-[1099px]:w-[360px] max-[1099px]:shadow-2xl
          max-[767px]:w-full"
      >
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-ink leading-tight">{c.name}</div>
            <div className="text-xs text-muted">{c.admin2 !== "—" ? `${c.admin2}, ` : ""}{c.admin1}</div>
          </div>
          <button onClick={() => { selectCommunity(null); setTab("overview"); }} className="text-faint hover:text-ink"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-4 mt-3 border-b border-border">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabBtn>
          <TabBtn active={tab === "evidence"} onClick={() => setTab("evidence")}>Evidence</TabBtn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "overview" ? <OverviewTab c={c} /> : <EvidenceTab c={c} />}
      </div>
      </aside>
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`relative pb-2.5 text-sm font-medium ${active ? "text-ink" : "text-faint hover:text-muted"}`}>
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-action rounded-full" />}
    </button>
  );
}

function OverviewTab({ c }: { c: Community }) {
  const { eventId, stepIndex, mode } = useStore();
  const status = computeStep(eventId, stepIndex).snapshots.get(c.id)?.floodStatus;
  const flooded = status === "inundated" || status === "partial" || status === "at-risk";
  const photo = mode === "observed" ? photoFor(c.name, getEvent(eventId).regionId, flooded) : photoFor(c.name, getEvent(eventId).regionId, false);

  return (
    <>
      {photo && (
        <div className="mb-3 overflow-hidden rounded-xl border border-border bg-field">
          <img src={photo.url} alt={`${c.name} flood`} loading="lazy" className="h-32 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[9px] text-faint">
            <span>{photo.credit}</span>
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="text-action hover:underline">source</a>
          </div>
        </div>
      )}

      {mode === "observed" ? <ObservedView c={c} eventId={eventId} stepIndex={stepIndex} /> : <ForecastView c={c} />}
      <SusceptibilityBlock communityId={c.id} />
    </>
  );
}

function EvidenceTab({ c }: { c: Community }) {
  const { eventId, mode } = useStore();
  const event = getEvent(eventId);
  const status = mode === "observed" ? computeStep(eventId, useStore.getState().stepIndex).snapshots.get(c.id)?.floodStatus : undefined;
  const flooded = status === "inundated" || status === "partial" || status === "at-risk";
  const photo = photoFor(c.name, event.regionId, flooded);
  const exact = photo?.note?.toLowerCase().startsWith(c.name.toLowerCase());

  return (
    <div className="space-y-3">
      {photo ? (
        <div className="rounded-xl border border-border bg-field overflow-hidden">
          <img src={photo.url} alt="" loading="lazy" className="h-36 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div className="p-2.5">
            <span className={`text-[9px] font-semibold px-1.5 py-[1px] rounded uppercase ${exact ? "bg-success/20 text-success" : "bg-priority/20 text-priority"}`}>
              {exact ? "This community" : "Regional reference"}
            </span>
            <div className="text-[11px] text-muted mt-1.5">{photo.note ?? "No capture date on record."}</div>
            <div className="text-[9px] text-faint mt-1">{photo.credit} · {photo.license}</div>
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-action hover:underline mt-1 inline-block">Open source →</a>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-field p-3 text-[11px] text-faint">No photo evidence on record for this community.</div>
      )}
      <div className="text-[11px] text-faint leading-relaxed">Full evidence registry (mapped layers, event reports, mismatch reporting) opens from the Evidence tab of the main navigation.</div>
    </div>
  );
}

function ObservedView({ c, eventId, stepIndex }: { c: Community; eventId: string; stepIndex: number }) {
  const { snapshots, priorities } = computeStep(eventId, stepIndex);
  const snap = snapshots.get(c.id);
  const prio = priorities.find((p) => p.communityId === c.id);
  if (!snap || !prio) return null;
  const st = STATUS[snap.floodStatus];
  const col = PRIORITY_COLOR[prio.level];
  const day = getEvent(eventId).steps[stepIndex].day;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: `${st.color}1f`, color: st.color }}>{st.label}</span>
        <span className="text-[11px] text-muted mono">as of {day}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[40px] leading-none font-semibold mono" style={{ color: col }}><AnimatedNumber value={prio.score} format={(v) => String(Math.round(v))} /></div>
          <div className="text-[10px] uppercase tracking-wide text-faint mt-1">Response priority · {prio.level}</div>
        </div>
        <div className="text-right text-[10px] text-faint">confidence<br /><span className="mono text-ink text-sm">{Math.round(prio.confidence * 100)}%</span></div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Row icon={Users} label="People exposed" value={snap.populationExposed ? `≈${(snap.populationExposed.value / 1000).toFixed(1)}k${snap.populationExposed.range ? ` (${(snap.populationExposed.range[0] / 1000).toFixed(1)}–${(snap.populationExposed.range[1] / 1000).toFixed(1)}k)` : ""}` : "—"} ev={snap.populationExposed?.evidence} />
        <Row icon={Droplets} label="Est. water depth" value={snap.depthBand?.value ?? "—"} ev={snap.depthBand?.evidence} />
        <Row icon={Route} label="Road access" value={roadLabel(snap.roadStatus.value)} ev={snap.roadStatus.evidence} />
        <Row icon={Home} label="Nearest safe town" value={snap.nearestShelterKm ? `${snap.nearestShelterKm.value} km` : "—"} ev={snap.nearestShelterKm?.evidence} />
        <Row icon={Users} label="Community population" value={c.population ? `≈${(c.population.value / 1000).toFixed(1)}k` : "—"} ev={c.population?.evidence} />
      </div>

      <div className="text-[10px] uppercase tracking-wide text-faint mt-4 mb-1.5">Why this priority</div>
      <div className="space-y-1.5">
        {prio.factors.map((f) => (
          <div key={f.code} className="flex items-start gap-2.5">
            <span className="mono text-sm font-semibold w-7 shrink-0" style={{ color: col }}>+{f.contribution}</span>
            <span className="flex-1"><span className="text-xs block text-ink">{f.label}</span>{f.detail && <span className="text-[10px] text-faint">{f.detail}</span>}</span>
            {f.evidence && <Evidence ev={f.evidence} />}
          </div>
        ))}
        {prio.factors.length === 0 && <div className="text-[11px] text-faint">Outside modeled flood extent at this timestep.</div>}
      </div>

      <div className="mt-3 bg-action/10 border border-action/25 rounded-xl p-3">
        <div className="text-[10px] font-semibold text-action mb-1">FLOOD INTELLIGENCE</div>
        <p className="text-[11px] leading-relaxed text-muted">{insight(c.name, snap, prio.score)}</p>
      </div>
    </>
  );
}

function ForecastView({ c }: { c: Community }) {
  const risk = computeForecastRisk(c.id);
  const hazard = getForecastHazard(
    c.id.startsWith("FN") ? "farNorth" : c.id.startsWith("DL") ? "douala" : c.id.startsWith("WV") ? "whiteVolta" : "lowerVolta",
  );
  if (!risk) return <div className="text-[11px] text-faint mt-3">No terrain features for this community.</div>;
  const col = RISK_CLASS_COLOR[risk.class];

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase" style={{ background: `${col}1f`, color: col }}>{risk.class} risk</span>
        <span className="text-[11px] text-muted mono">lead ~{risk.leadHours}h</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[40px] leading-none font-semibold mono" style={{ color: col }}><AnimatedNumber value={risk.index} format={(v) => String(Math.round(v))} /></div>
          <div className="text-[10px] uppercase tracking-wide text-faint mt-1">Next-flood risk index · {risk.class}</div>
        </div>
        <div className="text-right text-[10px] text-faint">confidence<br /><span className="mono text-ink text-sm">{Math.round(risk.confidence * 100)}%</span></div>
      </div>

      <div className="mt-3 rounded-xl border border-action/20 bg-action/[0.06] p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-ink">Pattern match · {hazard.scenario}</span>
          <span className="mono text-sm font-semibold text-action">{Math.round(risk.patternMatch * 100)}%</span>
        </div>
        {hazard.matches.map((m) => (
          <div key={m.label} className="flex items-center gap-2 py-0.5 text-[11px]">
            <span className="text-low">{m.matched ? "✓" : "○"}</span>
            <span className="flex-1 min-w-0"><span className="block text-muted">{m.label}</span><span className="text-[9px] text-faint">{m.detail}</span></span>
            <Evidence ev={m.evidence} />
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-wide text-faint mt-4 mb-1.5">Why this risk</div>
      <div className="space-y-1.5">
        {risk.factors.map((f) => (
          <div key={f.code} className="flex items-start gap-2.5">
            <span className="mono text-sm font-semibold w-7 shrink-0" style={{ color: col }}>+{f.contribution}</span>
            <span className="flex-1"><span className="text-xs block text-ink">{f.label}</span>{f.detail && <span className="text-[10px] text-faint">{f.detail}</span>}</span>
            {f.evidence && <Evidence ev={f.evidence} />}
          </div>
        ))}
      </div>

      <div className="mt-3 bg-action/10 border border-action/25 rounded-xl p-3">
        <div className="text-[10px] font-semibold text-action mb-1">FORECAST INTELLIGENCE</div>
        <p className="text-[11px] leading-relaxed text-muted">
          If conditions resemble the historical flood pattern for this basin, {c.name} carries {risk.class.toUpperCase()} next-flood risk (index {risk.index}, ~{risk.leadHours}h lead). Ordinal index — not a calibrated probability.
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
        <span className="text-[10px] uppercase tracking-wide text-faint">Baseline susceptibility</span>
        <Evidence ev={s.evidence} />
      </div>
      <div className="bg-field rounded-lg p-2.5 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase" style={{ background: `${col}1f`, color: col }}>{s.class.replace("-", " ")}</span>
          <span className="mono text-sm font-semibold" style={{ color: col }}>{s.index}<span className="text-faint text-[10px]">/100</span></span>
        </div>
        <div className="h-1.5 rounded-full bg-raised mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.index}%`, background: col }} /></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
          <Kv2 label="HAND" value={`${s.features.handM} m`} />
          <Kv2 label="Elevation" value={`${s.features.elevM} m`} />
          <Kv2 label="Dist. to river" value={`${s.features.distRiverM} m`} />
          <Kv2 label="Flooded 2023" value={s.features.floodedBefore ? "Yes" : "No"} />
        </div>
      </div>
    </>
  );
}

function Kv2({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted">{label}</span><span className="mono font-medium text-ink">{value}</span></div>;
}

function roadLabel(v: string) {
  return v === "road-cut" ? "Likely cut" : v === "restricted" ? "Restricted" : v === "accessible" ? "Accessible" : "Unknown";
}
function insight(name: string, snap: { floodStatus: FloodStatus; roadStatus: { value: string }; depthBand?: { value: string }; populationExposed?: { value: number } }, score: number) {
  if (snap.floodStatus === "safe") return `${name} lies outside the modeled flood extent at this timestep and is a candidate staging point. Monitoring only.`;
  const cut = snap.roadStatus.value === "road-cut" ? " Primary road access appears cut, so alternate routing may be required." : "";
  return `${name} intersects the modeled flood extent with an estimated ${snap.depthBand?.value ?? "shallow"} depth and ≈${((snap.populationExposed?.value ?? 0) / 1000).toFixed(1)}k people exposed.${cut} Response priority ${score}. Figures are modeled estimates — field verification recommended.`;
}

function Row({ icon: Icon, label, value, ev }: { icon: typeof Users; label: string; value: string; ev?: EvidenceRef }) {
  return (
    <div className="flex items-center gap-2 bg-field rounded-lg px-2.5 py-1.5 border border-border">
      <Icon size={14} className="text-action shrink-0" />
      <span className="text-[11px] text-muted flex-1 min-w-0 truncate">{label}</span>
      <span className="mono text-xs font-medium text-ink">{value}</span>
      {ev && <Evidence ev={ev} />}
    </div>
  );
}
