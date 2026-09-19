import { useState } from "react";
import { Pencil, X, ExternalLink, LogOut, User, Sliders, Bell, PlayCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getRegion } from "../data/regions";
import MapBanner from "../components/MapBanner";
import QrPreviewCard from "../components/QrPreviewCard";
import { navigate, AppLink, usePathname } from "../platform/router";

const REGION_OPTIONS = [
  { id: "lowerVolta", label: "Ghana / Lower Volta" },
  { id: "whiteVolta", label: "Ghana / White Volta" },
  { id: "farNorth", label: "Cameroon / Far North" },
  { id: "douala", label: "Cameroon / Douala" },
];

function loadNames(): string { try { return localStorage.getItem("avert.account.displayName.v1") ?? ""; } catch { return ""; } }
function loadSavedRegions(): string[] { try { const raw = localStorage.getItem("avert.account.savedRegions.v1"); return raw ? JSON.parse(raw) : ["lowerVolta", "farNorth"]; } catch { return ["lowerVolta", "farNorth"]; } }

export default function AccountPage() {
  const { session, signOut } = useAuth();
  const path = usePathname();

  const [displayName, setDisplayName] = useState(() => loadNames() || session?.user.name || "Demo operator");
  const [editing, setEditing] = useState(false);
  const [savedRegions, setSavedRegions] = useState<string[]>(loadSavedRegions);
  const [savedFlash, setSavedFlash] = useState(false);

  const region = getRegion("lowerVolta");

  const save = () => {
    try {
      localStorage.setItem("avert.account.displayName.v1", displayName);
      localStorage.setItem("avert.account.savedRegions.v1", JSON.stringify(savedRegions));
    } catch { /* storage unavailable */ }
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500);
  };

  const removeRegion = (id: string) => setSavedRegions((r) => r.filter((x) => x !== id));
  const addRegion = (id: string) => { if (id && !savedRegions.includes(id)) setSavedRegions((r) => [...r, id]); };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="h-40 relative border-b border-border">
        <MapBanner center={region.view.center} zoom={7} basemap="dark" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
        <div className="absolute bottom-4 left-5">
          <h1 className="text-3xl font-semibold text-ink">Account</h1>
          <p className="text-sm text-muted">Your profile and workspace access.</p>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr_320px] gap-6 max-w-5xl mx-auto p-6 max-[1099px]:grid-cols-1">
        <nav className="space-y-0.5">
          <SubNav icon={User} label="Profile" active={path === "/app/account"} to="/app/account" />
          <AppLink to="/app/preferences" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-hover"><Sliders size={14} /> Preferences</AppLink>
          <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-faint cursor-not-allowed"><Bell size={14} /> Notifications</span>
          <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-faint cursor-not-allowed"><PlayCircle size={14} /> Demo session</span>
        </nav>

        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-raised border border-border flex items-center justify-center text-lg font-semibold text-ink">{session?.user.initials ?? "DO"}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-ink">{displayName}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-field border border-border text-muted">Preview access</span>
              </div>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-action hover:underline mt-0.5"><Pencil size={11} /> Edit display name</button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-ink mb-2">Profile details</div>
            <label className="text-xs text-muted">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!editing} className="w-full h-10 mt-1 px-3 rounded-lg bg-field border border-border text-sm text-ink disabled:opacity-70 outline-none focus:border-action/50" />
            <label className="text-xs text-muted mt-3 block">Email</label>
            <input value={session?.user.email ?? "Not connected in demo"} disabled className="w-full h-10 mt-1 px-3 rounded-lg bg-field border border-border text-sm text-faint" />
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-ink mb-2">Workspace</div>
            <input value="Avert demo workspace" disabled className="w-full h-10 px-3 rounded-lg bg-field border border-border text-sm text-faint" />
            <p className="text-[11px] text-faint mt-1">Explore supported regions and historical scenarios.</p>

            <label className="text-xs text-muted mt-3 block">Saved regions</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {savedRegions.map((id) => (
                <span key={id} className="flex items-center gap-1.5 bg-field border border-border rounded-full pl-3 pr-1.5 py-1 text-xs text-ink">
                  {REGION_OPTIONS.find((r) => r.id === id)?.label ?? id}
                  <button onClick={() => removeRegion(id)} className="hover:text-danger"><X size={12} /></button>
                </span>
              ))}
              <select onChange={(e) => addRegion(e.target.value)} value="" className="text-xs bg-field border border-border rounded-full px-2 py-1 text-muted">
                <option value="">+ Add region</option>
                {REGION_OPTIONS.filter((r) => !savedRegions.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button onClick={save} className="h-10 px-4 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90">Save profile</button>
            {savedFlash && <span className="text-xs text-success">Saved on this device for the preview.</span>}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-sm font-semibold text-ink mb-2">Current workspace</div>
            <div className="h-32 rounded-xl overflow-hidden border border-border relative">
              <MapBanner center={getRegion("farNorth").view.center} zoom={5} basemap="dark" />
            </div>
            <div className="text-sm font-medium text-ink mt-2">Avert demo workspace</div>
            <div className="text-xs text-faint">Flood intelligence · Demo session</div>
            <button onClick={() => navigate("/app")} className="flex items-center gap-1 text-xs text-action hover:underline mt-1.5"><ExternalLink size={12} /> Open workspace</button>
          </div>

          <QrPreviewCard />

          <div>
            <div className="text-sm font-semibold text-ink mb-1">Session</div>
            <p className="text-xs text-faint mb-2">Return to the login screen when you finish.</p>
            <button onClick={() => { signOut(); navigate("/login"); }} className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover"><LogOut size={14} /> End demo session</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubNav({ icon: Icon, label, active, to }: { icon: typeof User; label: string; active: boolean; to: string }) {
  return (
    <AppLink to={to} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active ? "bg-action/10 text-action" : "text-muted hover:text-ink hover:bg-hover"}`}>
      <Icon size={14} /> {label}
    </AppLink>
  );
}
