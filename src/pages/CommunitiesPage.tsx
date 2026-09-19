import { useMemo, useState } from "react";
import { Download, Bookmark, Search, ChevronUp, ChevronDown, ArrowUpDown, Maximize2, X } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";
import { computeStep, communityById } from "../services/exposure";
import { forecastRanking } from "../services/forecast";
import { photoFor } from "../data/photos";
import { PRIORITY_COLOR, RISK_CLASS_COLOR, type PriorityLevel, type RiskClass } from "../models/contracts";
import { mapBus } from "../mapBus";
import { navigate } from "../platform/router";

interface Row {
  id: string; name: string; admin: string;
  exposure: number | null; exposureLabel: string;
  road: string; score: number; level: string; color: string;
}

const roadLabel = (v: string) => v === "road-cut" ? "Likely cut" : v === "restricted" ? "Restricted" : v === "accessible" ? "Accessible" : "Unknown";

function buildRows(mode: "observed" | "forecast", eventId: string, stepIndex: number, communities: ReturnType<typeof getRegion>["communities"]): Row[] {
  const admin = (c: { admin1?: string; admin2?: string }) => (c.admin2 && c.admin2 !== "—" ? `${c.admin2}, ` : "") + (c.admin1 ?? "");
  if (mode === "observed") {
    const { snapshots, priorities } = computeStep(eventId, stepIndex);
    return communities.map((c) => {
      const snap = snapshots.get(c.id);
      const prio = priorities.find((p) => p.communityId === c.id);
      const level = (prio?.level ?? "monitor") as PriorityLevel;
      return {
        id: c.id, name: c.name, admin: admin(c),
        exposure: snap?.populationExposed?.value ?? null,
        exposureLabel: snap?.populationExposed ? `≈${(snap.populationExposed.value / 1000).toFixed(1)}k` : "Not available",
        road: snap ? roadLabel(snap.roadStatus.value) : "Not available",
        score: prio?.score ?? 0, level, color: PRIORITY_COLOR[level],
      };
    });
  }
  const ranking = forecastRanking(communities);
  return communities.map((c) => {
    const r = ranking.find((x) => x.communityId === c.id);
    const cls = (r?.class ?? "low") as RiskClass;
    return {
      id: c.id, name: c.name, admin: admin(c),
      exposure: null, exposureLabel: "Not applicable · forecast",
      road: "Not available",
      score: r?.index ?? 0, level: cls, color: RISK_CLASS_COLOR[cls],
    };
  });
}

function csvCell(v: string | number) {
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // formula-injection guard for spreadsheet apps
  return `"${s.replace(/"/g, '""')}"`;
}

interface SavedView { id: string; name: string; q: string; level: string; road: string; createdAt: string }
const VIEWS_KEY = "avert.communities.views.v1";
function loadViews(): SavedView[] {
  try { const raw = localStorage.getItem(VIEWS_KEY); return raw ? JSON.parse(raw) as SavedView[] : []; } catch { return []; }
}
function saveViews(v: SavedView[]) { try { localStorage.setItem(VIEWS_KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export function CommunitiesList() {
  const { eventId, mode, stepIndex, selectedId, selectCommunity } = useStore();
  const event = getEvent(eventId);
  const region = getRegion(event.regionId);
  const rows = useMemo(() => buildRows(mode, eventId, stepIndex, region.communities), [mode, eventId, stepIndex, region]);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [road, setRoad] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "exposure" | "score">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [views, setViews] = useState<SavedView[]>(() => loadViews());
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState("");

  const filtered = rows
    .filter((r) => (q.trim() ? r.name.toLowerCase().includes(q.trim().toLowerCase()) : true))
    .filter((r) => (level === "all" ? true : r.level === level))
    .filter((r) => (road === "all" ? true : r.road === road));
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    if (sortKey === "exposure") return ((a.exposure ?? -1) - (b.exposure ?? -1)) * dir;
    return (a.score - b.score) * dir;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const exportList = () => {
    const header = ["Community", "Admin area", "Est. exposure", "Road access", mode === "observed" ? "Priority score" : "Risk index", mode === "observed" ? "Priority level" : "Risk class", "Region", "Event", "Mode"];
    const body = sorted.map((r) => [r.name, r.admin, r.exposureLabel, r.road, r.score, r.level, region.name, event.meta.name, mode]);
    const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `avert-communities-${event.regionId}-${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const persistView = () => {
    if (!viewName.trim()) return;
    const next = [...views, { id: crypto.randomUUID(), name: viewName.trim(), q, level, road, createdAt: new Date().toISOString() }];
    setViews(next); saveViews(next); setViewName(""); setSaving(false);
  };
  const openView = (v: SavedView) => { setQ(v.q); setLevel(v.level); setRoad(v.road); };
  const deleteView = (id: string) => { const next = views.filter((v) => v.id !== id); setViews(next); saveViews(next); };

  const levels = mode === "observed" ? ["monitor", "priority", "urgent", "critical"] : ["low", "moderate", "high", "severe"];
  const selected = selectedId ? communityById(selectedId) : undefined;
  const selectedRow = selected ? sorted.find((r) => r.id === selected.id) ?? rows.find((r) => r.id === selected.id) : undefined;
  const photo = selected ? photoFor(selected.name, region.id, true) : undefined;

  return (
    <aside className="w-[440px] max-[1099px]:w-full shrink-0 h-full bg-surface border-r border-border flex flex-col overflow-hidden z-20">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-ink leading-tight">Communities</h1>
            <p className="text-xs text-muted mt-0.5">Prioritize communities in the selected event.</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={exportList} title="Export filtered list" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-field hover:bg-hover border border-border text-[11px] font-medium text-ink"><Download size={13} /> Export</button>
            <button onClick={() => setSaving((v) => !v)} title="Save this filtered view" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-action/15 hover:bg-action/25 border border-action/25 text-[11px] font-medium text-action"><Bookmark size={13} /> Save view</button>
          </div>
        </div>
        <div className="mt-2 text-sm"><span className="font-semibold text-ink">{rows.length}</span> <span className="text-faint">affected · {mode === "observed" ? "historical estimates" : "forecast index"}</span></div>

        {saving && (
          <div className="mt-2 flex items-center gap-1.5">
            <input value={viewName} onChange={(e) => setViewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && persistView()} placeholder="View name…" className="flex-1 h-8 px-2.5 rounded-lg bg-field border border-border text-xs text-ink outline-none focus:border-action/50" autoFocus />
            <button onClick={persistView} className="h-8 px-3 rounded-lg bg-action text-white text-xs font-medium">Save</button>
          </div>
        )}
        {views.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {views.map((v) => (
              <span key={v.id} className="flex items-center gap-1 bg-field border border-border rounded-full pl-2 pr-1 py-0.5 text-[10px] text-muted">
                <button onClick={() => openView(v)} className="hover:text-ink">{v.name}</button>
                <button onClick={() => deleteView(v.id)} className="hover:text-critical"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2 bg-field border border-border rounded-lg px-2.5 h-8">
          <Search size={13} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a community" className="bg-transparent outline-none text-xs text-ink placeholder:text-faint w-full" />
        </div>
        <div className="flex gap-2">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1 h-8 px-2 rounded-lg bg-field border border-border text-xs text-ink">
            <option value="all">All priority</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={road} onChange={(e) => setRoad(e.target.value)} disabled={mode === "forecast"} className="flex-1 h-8 px-2 rounded-lg bg-field border border-border text-xs text-ink disabled:opacity-40">
            <option value="all">All road access</option>
            <option>Accessible</option><option>Restricted</option><option>Likely cut</option><option>Unknown</option>
          </select>
        </div>
        {(q || level !== "all" || road !== "all") && (
          <button onClick={() => { setQ(""); setLevel("all"); setRoad("all"); }} className="text-[11px] text-action hover:underline">Reset filters</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="text-[10px] uppercase tracking-wide text-faint border-b border-border">
              <Th label="Community" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
              <Th label="Exposure" active={sortKey === "exposure"} dir={sortDir} onClick={() => toggleSort("exposure")} />
              <th className="text-left px-3 py-2 font-medium">Road</th>
              <Th label={mode === "observed" ? "Priority" : "Risk"} active={sortKey === "score"} dir={sortDir} onClick={() => toggleSort("score")} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} onClick={() => selectCommunity(r.id)} className={`cursor-pointer border-b border-border/60 hover:bg-hover ${selectedId === r.id ? "bg-action/10" : ""}`}>
                <td className="px-3 py-2 font-medium text-ink">{r.name}</td>
                <td className="px-3 py-2 text-muted mono">{r.exposureLabel === "Not available" || r.exposureLabel.startsWith("Not applicable") ? <span className="text-faint">{r.exposureLabel}</span> : r.exposureLabel}</td>
                <td className="px-3 py-2 text-muted">{r.road}</td>
                <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />{mode === "observed" ? r.score : `${r.score} · ${r.level}`}</span></td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-faint text-xs">No communities match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && selectedRow && (
        <div className="border-t border-border p-3 shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-faint mb-1.5">Selected community</div>
          <div className="flex gap-3 bg-field rounded-xl border border-border p-2.5">
            {photo && <img src={photo.url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{selected.name}</div>
              <div className="text-[10px] text-faint">Est. exposure {selectedRow.exposureLabel} · {selectedRow.road}</div>
              <button onClick={() => navigate("/app")} className="mt-1.5 text-[11px] font-medium text-action hover:underline">Open assessment →</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function Th({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <th className="text-left px-3 py-2 font-medium cursor-pointer select-none" onClick={onClick}>
      <span className="inline-flex items-center gap-1">{label} {active ? (dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ArrowUpDown size={10} className="opacity-40" />}</span>
    </th>
  );
}

export function CommunitiesMapControls() {
  const { eventId } = useStore();
  const region = getRegion(getEvent(eventId).regionId);
  const fit = () => {
    const map = mapBus.map;
    if (!map || region.communities.length === 0) return;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const c of region.communities) {
      if (c.lng < minLng) minLng = c.lng; if (c.lng > maxLng) maxLng = c.lng;
      if (c.lat < minLat) minLat = c.lat; if (c.lat > maxLat) maxLat = c.lat;
    }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 900 });
  };
  return (
    <button onClick={fit} className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface/90 backdrop-blur border border-border text-xs font-medium text-ink hover:bg-hover">
      <Maximize2 size={13} /> Fit communities
    </button>
  );
}
