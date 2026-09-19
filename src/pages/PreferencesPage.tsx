import { useState } from "react";
import { User, Sliders, Bell, PlayCircle, Save, RotateCcw } from "lucide-react";
import { usePreferencesStore, DEFAULT_PREFERENCES, type Preferences } from "../stores/preferencesStore";
import { useStore, type Basemap } from "../store";
import { getRegion } from "../data/regions";
import { eventsInRegion } from "../data/flood";
import MapBanner from "../components/MapBanner";
import { AppLink, usePathname } from "../platform/router";

const BASEMAPS: { id: Basemap; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "streets", label: "Streets" },
  { id: "satellite", label: "Satellite" },
];
const REGIONS = [
  { id: "lowerVolta", label: "Ghana / Lower Volta" },
  { id: "whiteVolta", label: "Ghana / White Volta" },
  { id: "farNorth", label: "Cameroon / Far North" },
  { id: "douala", label: "Cameroon / Douala" },
];

export default function PreferencesPage() {
  const path = usePathname();
  const { preferences, save, reset } = usePreferencesStore();
  const [draft, setDraft] = useState<Preferences>(preferences);
  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences);
  const setEvent = useStore((s) => s.setEvent);
  const setBasemap = useStore((s) => s.setBasemap);

  const applyToWorkspace = (p: Preferences) => {
    setBasemap(p.defaultBasemap);
    const evs = eventsInRegion(p.defaultRegionId);
    if (evs.length) setEvent(evs[evs.length - 1].id);
  };

  const region = getRegion(draft.defaultRegionId);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-40 relative border-b border-border">
        <MapBanner center={region.view.center} zoom={7} basemap={draft.defaultBasemap === "streets" ? "streets" : "dark"} />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        <div className="absolute bottom-4 left-5">
          <h1 className="text-3xl font-semibold text-ink">Preferences</h1>
          <p className="text-sm text-muted">Make the workspace work for you.</p>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr_320px] gap-6 max-w-5xl mx-auto p-6 max-[1099px]:grid-cols-1">
        <nav className="space-y-0.5">
          <AppLink to="/app/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover"><User size={14} /> Profile</AppLink>
          <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${path === "/app/preferences" ? "bg-action/10 text-action" : "text-muted"}`}><Sliders size={14} /> Preferences</span>
          <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-faint cursor-not-allowed"><Bell size={14} /> Notifications</span>
          <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-faint cursor-not-allowed"><PlayCircle size={14} /> Demo session</span>
        </nav>

        <div>
          <div className="text-sm font-semibold text-ink mb-2">Map appearance</div>
          <div className="grid grid-cols-3 gap-2.5">
            {BASEMAPS.map((b) => (
              <button key={b.id} onClick={() => setDraft((d) => ({ ...d, defaultBasemap: b.id }))} className={`rounded-xl border-2 overflow-hidden ${draft.defaultBasemap === b.id ? "border-action" : "border-border"}`}>
                <div className="h-16" style={{ background: b.id === "dark" ? "#0d1b25" : b.id === "streets" ? "#c9d6dd" : "#2a3a2a" }} />
                <div className="text-[11px] text-ink py-1.5">{b.label}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <Field label="Default region">
              <select value={draft.defaultRegionId} onChange={(e) => setDraft((d) => ({ ...d, defaultRegionId: e.target.value }))} className="w-full h-9 px-2.5 rounded-lg bg-field border border-border text-sm text-ink">
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={draft.language} onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value as Preferences["language"] }))} className="w-full h-9 px-2.5 rounded-lg bg-field border border-border text-sm text-ink">
                <option value="en">English</option><option value="fr">Français</option>
              </select>
            </Field>
            <Field label="Units">
              <select value={draft.units} onChange={(e) => setDraft((d) => ({ ...d, units: e.target.value as Preferences["units"] }))} className="w-full h-9 px-2.5 rounded-lg bg-field border border-border text-sm text-ink">
                <option value="metric">Metric</option><option value="imperial">Imperial</option>
              </select>
            </Field>
            <Field label="Motion">
              <select value={draft.motion} onChange={(e) => setDraft((d) => ({ ...d, motion: e.target.value as Preferences["motion"] }))} className="w-full h-9 px-2.5 rounded-lg bg-field border border-border text-sm text-ink">
                <option value="device">Follow device setting</option><option value="reduced">Always reduced</option><option value="full">Always full</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={draft.rememberView} onChange={(e) => setDraft((d) => ({ ...d, rememberView: e.target.checked }))} className="h-4 w-4 accent-action" />
            Remember last-viewed region and mode
          </label>

          <div className="mt-6">
            <div className="text-sm font-semibold text-ink mb-2">AI assistance</div>
            <Toggle label="Use selected community context" desc="Keep answers relevant to the active assessment." checked={draft.aiUseContext} onChange={(v) => setDraft((d) => ({ ...d, aiUseContext: v }))} />
            <Toggle label="Generate explanations automatically" desc="When Ask Avert is open, auto-ask why the newly selected community matters." checked={draft.aiAutoExplain} onChange={(v) => setDraft((d) => ({ ...d, aiAutoExplain: v }))} />
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-ink mb-2">In-app notifications</div>
            <Toggle label="Simulation completed" checked={draft.notifySimCompleted} onChange={(v) => setDraft((d) => ({ ...d, notifySimCompleted: v }))} />
            <Toggle label="Simulated delivery failures" checked={draft.notifySimFailures} onChange={(v) => setDraft((d) => ({ ...d, notifySimFailures: v }))} />
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button onClick={() => { save(draft); applyToWorkspace(draft); }} disabled={!dirty} className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90 disabled:opacity-50"><Save size={14} /> Save preferences</button>
            <button onClick={() => { reset(); setDraft(DEFAULT_PREFERENCES); applyToWorkspace(DEFAULT_PREFERENCES); }} className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover"><RotateCcw size={14} /> Reset defaults</button>
            {dirty && <span className="text-[11px] text-priority">Unsaved changes</span>}
            <span className="text-[11px] text-faint ml-auto">Preferences are stored on this device for the demo.</span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-sm font-semibold text-ink mb-2">Workspace preview</div>
            <div className="h-40 rounded-xl overflow-hidden border border-border">
              <MapBanner center={region.view.center} zoom={8} basemap={draft.defaultBasemap === "streets" ? "streets" : "dark"} />
            </div>
            <div className="text-xs text-ink mt-2">{draft.defaultBasemap === "dark" ? "Dark" : draft.defaultBasemap === "streets" ? "Streets" : "Satellite"} · {region.name}</div>
            <div className="text-[11px] text-faint">{draft.language === "fr" ? "Français" : "English"} · {draft.units === "metric" ? "Metric" : "Imperial"}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-ink mb-2">Notification preview</div>
            <div className="rounded-xl border border-border bg-surface p-3 flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-full bg-action/15 text-action flex items-center justify-center shrink-0"><Bell size={13} /></span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-ink flex items-center gap-1.5">Simulation completed <span className="text-[9px] text-faint font-normal">Demo example</span></div>
                <div className="text-[11px] text-faint mt-0.5">Review the exercise results.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-muted block mb-1">{label}</label>{children}</div>;
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-ink">{label}</div>
        {desc && <div className="text-[11px] text-faint mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)} className={`w-10 h-5.5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-action" : "bg-field border border-border"}`} style={{ height: 22, width: 40 }}>
        <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${checked ? "left-[19px]" : "left-0.5"}`} style={{ height: 18, width: 18 }} />
      </button>
    </div>
  );
}
