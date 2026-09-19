import { useState } from "react";
import { MessageCircleQuestion, Search, MapPin, LogOut, User, Sliders, LayoutGrid } from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../auth/AuthContext";
import { navigate, usePathname, AppLink } from "../platform/router";
import BrandMark from "./BrandMark";
import { NotificationsBellButton } from "./NotificationsPanel";
import { ALL_COMMUNITIES } from "../data/regions";
import { eventsInRegion, getEvent } from "../data/flood";

const NAV: { label: string; path: string; enabled: boolean }[] = [
  { label: "Monitor", path: "/app", enabled: true },
  { label: "Communities", path: "/app/communities", enabled: true },
  { label: "Alerts", path: "/app/alerts", enabled: true },
  { label: "Evidence", path: "/app/evidence", enabled: true },
];

export default function AppHeader() {
  const { selectCommunity, setEvent, askAvertOpen, setAskAvertOpen } = useStore();
  const { session, signOut } = useAuth();
  const path = usePathname();
  const askAvertAvailable = path === "/app" || path === "/app/communities";
  const [q, setQ] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const results = q.trim().length >= 2 ? ALL_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  const jumpTo = (id: string) => {
    const regionId = id.startsWith("FN") ? "farNorth" : id.startsWith("DL") ? "douala" : id.startsWith("WV") ? "whiteVolta" : "lowerVolta";
    if (getEvent(useStore.getState().eventId).regionId !== regionId) {
      const evs = eventsInRegion(regionId);
      setEvent(evs[evs.length - 1].id);
    }
    selectCommunity(id);
    setQ("");
    if (path !== "/app") navigate("/app");
  };

  return (
    <header className="h-[60px] shrink-0 flex items-center gap-5 px-4 bg-surface border-b border-border z-30">
      <AppLink to="/app" className="flex items-center gap-2 shrink-0">
        <BrandMark compact />
        <span className="font-semibold tracking-tight text-[16px]">Avert</span>
      </AppLink>

      <nav className="flex items-center gap-1 shrink-0">
        {NAV.map((n) => {
          const active = n.path === "/app" ? path === "/app" : path.startsWith(n.path);
          return n.enabled ? (
            <AppLink key={n.path} to={n.path} className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
              {n.label}
              {active && <span className="absolute left-3 right-3 -bottom-[19px] h-0.5 rounded-full bg-action" />}
            </AppLink>
          ) : (
            <span key={n.path} title="Coming soon in this build" className="px-3 py-1.5 rounded-md text-sm font-medium text-faint cursor-not-allowed">{n.label}</span>
          );
        })}
      </nav>

      <div className="hidden md:block flex-1 max-w-sm relative">
        <div className="flex items-center gap-2 bg-field border border-border rounded-lg px-3 h-9 text-muted focus-within:border-action/50">
          <Search size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) jumpTo(results[0].id); if (e.key === "Escape") setQ(""); }}
            placeholder="Search communities…"
            className="bg-transparent outline-none text-sm text-ink placeholder:text-faint w-full"
          />
        </div>
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-lg overflow-hidden shadow-2xl z-40">
            {results.map((c) => (
              <button key={c.id} onClick={() => jumpTo(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm">
                <MapPin size={13} className="text-action shrink-0" />
                <span className="text-ink">{c.name}</span>
                <span className="text-[10px] text-faint ml-auto truncate">{c.admin2 !== "—" ? `${c.admin2}, ` : ""}{c.admin1}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <button
          disabled={!askAvertAvailable}
          title={askAvertAvailable ? "Ask Avert" : "Ask Avert — not available on this page"}
          onClick={() => { if (path !== "/app" && path !== "/app/communities") navigate("/app"); setAskAvertOpen(!askAvertOpen); }}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border ${askAvertOpen ? "bg-action/15 border-action/30 text-action" : "border-border text-ink hover:bg-hover"} ${!askAvertAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <MessageCircleQuestion size={14} /> <span className="max-lg:hidden">Ask Avert</span>
        </button>
        <NotificationsBellButton />
        <div className="relative">
          <button onClick={() => setAccountOpen((v) => !v)} title="Account" className="w-8 h-8 rounded-full bg-raised border border-border flex items-center justify-center text-[11px] font-medium hover:border-action/50">
            {session?.user.initials ?? "AV"}
          </button>
          {accountOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-52 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden z-40">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="text-xs font-medium text-ink truncate">{session?.user.name ?? "Demo operator"}</div>
                <div className="text-[10px] text-faint truncate">{session?.user.email ?? "Demo workspace"}</div>
              </div>
              <button onClick={() => { setAccountOpen(false); navigate("/hazards"); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm text-ink">
                <LayoutGrid size={14} /> Switch hazard
              </button>
              <button onClick={() => { setAccountOpen(false); navigate("/app/account"); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm text-ink">
                <User size={14} /> Account
              </button>
              <button onClick={() => { setAccountOpen(false); navigate("/app/preferences"); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm text-ink">
                <Sliders size={14} /> Preferences
              </button>
              <div className="border-t border-border" />
              <button onClick={() => { setAccountOpen(false); signOut(); navigate("/login"); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover text-sm text-ink">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
