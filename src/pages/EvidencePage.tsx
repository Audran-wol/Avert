import { useMemo, useState } from "react";
import { Image, Map as MapIcon, FileText, Flag, ExternalLink, Search, Rss, MapPin } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { getRegion } from "../data/regions";
import { COMMUNITY_PHOTOS, type CommunityPhoto } from "../data/photos";
import { FRESH_RECORDS, FRESH_TYPE_LABEL, FRESH_TYPE_COLOR, type FreshRecordType } from "../data/freshEvidence";
import { mapBus } from "../mapBus";
import { navigate } from "../platform/router";

type Tab = "photos" | "layers" | "reports" | "recent";

interface PhotoItem { photo: CommunityPhoto; communityName: string; exact: boolean }

const FEEDBACK_KEY = "avert.evidence.feedback.v1";
function pushFeedback(entry: { photoUrl: string; note: string; createdAt: string }) {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
  } catch { /* storage unavailable */ }
}

export default function EvidencePage() {
  const { eventId } = useStore();
  const event = getEvent(eventId);
  const region = getRegion(event.regionId);
  const [tab, setTab] = useState<Tab>("photos");
  const [q, setQ] = useState("");

  const photoItems = useMemo<PhotoItem[]>(() => {
    const seen = new Set<string>();
    const items: PhotoItem[] = [];
    for (const c of region.communities) {
      const exact = COMMUNITY_PHOTOS[c.name];
      if (exact && !seen.has(exact.url)) { seen.add(exact.url); items.push({ photo: exact, communityName: c.name, exact: true }); }
    }
    return items;
  }, [region]);

  const filtered = photoItems.filter((i) => (q.trim() ? (i.communityName + " " + (i.photo.note ?? "")).toLowerCase().includes(q.trim().toLowerCase()) : true));
  const [activeIdx, setActiveIdx] = useState(0);
  const [reported, setReported] = useState<string | null>(null);
  const active = filtered[activeIdx] ?? filtered[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="px-5 pt-5 pb-0 shrink-0">
        <h1 className="text-2xl font-semibold text-ink">Evidence</h1>
        <p className="text-sm text-muted mt-0.5">Understand what supports each assessment · {region.name}</p>
        <div className="flex items-center gap-1 mt-4 border-b border-border">
          <TabBtn active={tab === "photos"} onClick={() => setTab("photos")} icon={Image}>Photographs</TabBtn>
          <TabBtn active={tab === "layers"} onClick={() => setTab("layers")} icon={MapIcon}>Maps & layers</TabBtn>
          <TabBtn active={tab === "reports"} onClick={() => setTab("reports")} icon={FileText}>Reports</TabBtn>
          <TabBtn active={tab === "recent"} onClick={() => setTab("recent")} icon={Rss}>Recent reports <span className="ml-1 rounded-full bg-action/20 px-1.5 py-0.5 text-[9px] text-action">{FRESH_RECORDS.length}</span></TabBtn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === "photos" && (
          <div className="grid grid-cols-[1fr_320px] gap-5 max-[1099px]:grid-cols-1">
            <div>
              <div className="flex items-center gap-2 bg-field border border-border rounded-lg px-3 h-9 mb-3 max-w-sm">
                <Search size={14} className="text-faint" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }} placeholder="Search evidence…" className="bg-transparent outline-none text-sm text-ink placeholder:text-faint w-full" />
              </div>
              {active ? (
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <img src={active.photo.url} alt="" className="w-full h-[360px] object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="px-3 py-2 text-xs text-muted">{active.communityName} · exact community match</div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-faint">
                  No rights-cleared photographs matched to a specific community in {region.name} yet. Only verified community matches are shown here — no unrelated image is presented as local proof.
                </div>
              )}
              {filtered.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {filtered.map((i, idx) => (
                    <button key={i.photo.url} onClick={() => setActiveIdx(idx)} className={`rounded-lg overflow-hidden border-2 ${idx === activeIdx ? "border-action" : "border-transparent"}`}>
                      <img src={i.photo.url} alt="" className="h-16 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-sm font-semibold text-ink mb-3">Evidence details</div>
              {active ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded bg-success/15 text-success uppercase">This community</span>
                  <dl className="mt-3 space-y-2 text-xs">
                    <Row k="Community" v={active.communityName} />
                    <Row k="Capture date" v={active.photo.note?.split(" — ")[0]?.split(", ").slice(1).join(", ") || "Unknown"} />
                    <Row k="License" v={active.photo.license} />
                    <Row k="Source" v={active.photo.credit} />
                  </dl>
                  <p className="text-[11px] text-faint mt-3 leading-relaxed">What this supports: visual context for flood impacts. Does not establish local water depth or flood boundaries.</p>
                  <a href={active.photo.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-action hover:underline mt-3"><ExternalLink size={12} /> View source</a>
                  {reported === active.photo.url ? (
                    <div className="text-[11px] text-success mt-2">Noted locally — thanks. This demo does not notify the source.</div>
                  ) : (
                    <button
                      onClick={() => { pushFeedback({ photoUrl: active.photo.url, note: `Reported for ${active.communityName}`, createdAt: new Date().toISOString() }); setReported(active.photo.url); }}
                      className="flex items-center gap-1.5 text-xs text-danger hover:underline mt-2"
                    ><Flag size={12} /> Report a mismatch</button>
                  )}
                </>
              ) : <div className="text-xs text-faint">Select a photograph to see its details.</div>}
            </div>
          </div>
        )}

        {tab === "layers" && <LayersTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "recent" && <RecentReportsTab />}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-faint">{k}</dt><dd className="text-ink text-right">{v}</dd></div>;
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Image; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 px-3 pb-2.5 text-sm font-medium ${active ? "text-ink" : "text-faint hover:text-muted"}`}>
      <Icon size={14} /> {children}
      {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-action rounded-full" />}
    </button>
  );
}

const LAYER_ROWS = [
  { key: "district-line", label: "District boundaries", desc: "geoBoundaries gbOpen — administrative context" },
  { key: "river-line", label: "Rivers", desc: "OpenStreetMap Overpass — river channel geometry" },
  { key: "comm-dot", label: "Communities", desc: "OpenStreetMap Overpass — settlement points" },
  { key: "flood-fill", label: "Modeled flood extent", desc: "River-channel buffer model — inferred, not observed" },
] as const;

function LayersTab() {
  return (
    <div className="max-w-2xl space-y-2.5">
      {LAYER_ROWS.map((l) => (
        <div key={l.key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
          <div>
            <div className="text-sm font-medium text-ink">{l.label}</div>
            <div className="text-[11px] text-faint mt-0.5">{l.desc}</div>
          </div>
          <button
            onClick={() => { const m = mapBus.map; if (m?.getLayer(l.key)) m.setLayoutProperty(l.key, "visibility", "visible"); navigate("/app"); }}
            className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-action/15 hover:bg-action/25 border border-action/25 text-xs font-medium text-action"
          >Activate on Monitor</button>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const { eventId } = useStore();
  const event = getEvent(eventId);
  const externalEntries = Object.entries(event.meta.externalIds);
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-faint mb-1.5">Cited sources · {event.meta.name}</div>
        <div className="space-y-2">
          {event.meta.sources.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{s.sourceName ?? s.sourceId}</span>
                <span className="text-[9px] font-semibold px-1.5 py-[1px] rounded uppercase bg-action/15 text-action">{s.evidenceState}</span>
              </div>
              <div className="text-[11px] text-faint mt-1">{s.issuedAt ?? s.observedAt ?? "Date not on record"} · {s.sourceId}</div>
              {s.sourceUrl ? (
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-action hover:underline mt-1.5 inline-block">Open document →</a>
              ) : (
                <div className="text-[11px] text-faint mt-1.5">No linked document on record for this build.</div>
              )}
            </div>
          ))}
          {event.meta.sources.length === 0 && <div className="text-xs text-faint">No sources recorded for this event.</div>}
        </div>
      </div>
      {externalEntries.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-faint mb-1.5">External activation IDs</div>
          <div className="flex flex-wrap gap-1.5">
            {externalEntries.map(([k, v]) => <span key={k} className="text-[11px] px-2 py-1 rounded bg-field border border-border text-muted mono">{k}: {v}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

const FRESH_COUNTRY_LABEL: Record<"all" | "GHA" | "CMR", string> = { all: "All countries", GHA: "Ghana", CMR: "Cameroon" };

function RecentReportsTab() {
  const [country, setCountry] = useState<"all" | "GHA" | "CMR">("all");
  const [typeFilter, setTypeFilter] = useState<FreshRecordType | "all">("all");
  const records = FRESH_RECORDS.filter((r) => (country === "all" || r.country === country) && (typeFilter === "all" || r.type === typeFilter));

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] text-faint">Merged from an incremental research pack, retrieved 2026-09-19. Report-level evidence — not modeled flood extents.</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["all", "GHA", "CMR"] as const).map((c) => (
          <button key={c} onClick={() => setCountry(c)} className={`h-7 rounded-full border px-3 text-[11px] font-medium ${country === c ? "border-action/40 bg-action/15 text-action" : "border-border bg-field text-muted hover:text-ink"}`}>{FRESH_COUNTRY_LABEL[c]}</button>
        ))}
        <span className="mx-1 text-border">|</span>
        <button onClick={() => setTypeFilter("all")} className={`h-7 rounded-full border px-3 text-[11px] font-medium ${typeFilter === "all" ? "border-action/40 bg-action/15 text-action" : "border-border bg-field text-muted hover:text-ink"}`}>All types</button>
        {(Object.keys(FRESH_TYPE_LABEL) as FreshRecordType[]).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`h-7 rounded-full border px-3 text-[11px] font-medium ${typeFilter === t ? "border-action/40 bg-action/15 text-action" : "border-border bg-field text-muted hover:text-ink"}`}>{FRESH_TYPE_LABEL[t]}</button>
        ))}
      </div>

      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase" style={{ background: `${FRESH_TYPE_COLOR[r.type]}22`, color: FRESH_TYPE_COLOR[r.type] }}>{FRESH_TYPE_LABEL[r.type]}</span>
                  <span className="text-[11px] text-faint">{r.country === "GHA" ? "Ghana" : "Cameroon"}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-ink">{r.title}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-faint"><MapPin size={11} /> {r.locations.join(" · ")}</div>
              </div>
              <span className="mono shrink-0 text-[11px] text-muted">{r.dateLabel}</span>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{r.summary}</p>
            {r.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {r.photos.map((p, i) => (
                  <a key={i} href={p.sourceUrl} target="_blank" rel="noreferrer" title={p.credit} className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border">
                    <img src={p.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[9px] text-white/90">{p.credit}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {records.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-faint">No recent reports match these filters.</div>}
      </div>
    </div>
  );
}
