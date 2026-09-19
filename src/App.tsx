import { useEffect, useState } from "react";
import { useStore } from "./store";
import { fetchRainSnapshot } from "./services/weather";
import { warmCaches } from "./services/exposure";
import AppHeader from "./components/AppHeader";
import ContextBar from "./components/ContextBar";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import LayersControl from "./components/LayersControl";
import EventSummaryOverlay from "./components/EventSummaryOverlay";
import CommunityInspector from "./components/CommunityInspector";
import AskAvertPanel from "./components/AskAvertPanel";
import TimelinePlayer from "./components/TimelinePlayer";
import SourceConfidence from "./components/SourceConfidence";
import ModelPanel from "./components/ModelPanel";
import HistoryPanel from "./components/HistoryPanel";
import DemoMode from "./components/DemoMode";
import LoginPage from "./pages/LoginPage";
import { CommunitiesList, CommunitiesMapControls } from "./pages/CommunitiesPage";
import EvidencePage from "./pages/EvidencePage";
import AlertsHomePage from "./pages/AlertsHomePage";
import AlertComposerPage from "./pages/AlertComposerPage";
import SimulationResultsPage from "./pages/SimulationResultsPage";
import AccountPage from "./pages/AccountPage";
import PreferencesPage from "./pages/PreferencesPage";
import CompactPreviewPage from "./pages/CompactPreviewPage";
import HazardSelectPage from "./pages/HazardSelectPage";
import { useAuth } from "./auth/AuthContext";
import { navigate, usePathname } from "./platform/router";

export default function App() {
  const { session, ready } = useAuth();
  const path = usePathname();

  // /m is the QR-linked compact preview — a public, unauthenticated phone page. It bypasses
  // the demo-session gate entirely, same as a resident scanning a QR code would.
  const isCompactPreview = path === "/m" || path.startsWith("/m/");
  const isHazardSelect = path === "/hazards";

  useEffect(() => {
    if (session && !isCompactPreview && !isHazardSelect && !path.startsWith("/app")) navigate("/hazards", true);
  }, [session, path, isCompactPreview, isHazardSelect]);

  if (isCompactPreview) return <CompactPreviewPage />;
  if (!ready) return <div className="grid h-full place-items-center bg-canvas text-xs font-semibold uppercase tracking-[0.2em] text-faint">Loading Avert</div>;
  if (!session) return <LoginPage recovery={path === "/login/recover"} />;
  if (isHazardSelect) return <HazardSelectPage />;
  if (!path.startsWith("/app")) return null;
  return <MapWorkspace />;
}

function MapWorkspace() {
  const selectedId = useStore((s) => s.selectedId);
  const askAvertOpen = useStore((s) => s.askAvertOpen);
  const path = usePathname();
  const onCommunities = path.startsWith("/app/communities");
  const onEvidence = path.startsWith("/app/evidence");
  const onAlertsRun = path.startsWith("/app/alerts/run/");
  const onAlertsComposer = path === "/app/alerts/new" || (path.startsWith("/app/alerts/") && !onAlertsRun);
  const onAlertsHome = path === "/app/alerts";
  const onAlerts = onAlertsHome || onAlertsComposer || onAlertsRun;
  const onAccount = path.startsWith("/app/account");
  const onPreferences = path.startsWith("/app/preferences");
  const chromelessRoute = onAlerts || onAccount || onPreferences;
  const [weatherReady, setWeatherReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchRainSnapshot("lowerVolta").catch(() => undefined),
      fetchRainSnapshot("whiteVolta").catch(() => undefined),
      fetchRainSnapshot("farNorth").catch(() => undefined),
      fetchRainSnapshot("douala").catch(() => undefined),
    ]).finally(() => {
      if (active) setWeatherReady(true);
    });
    warmCaches(); // precompute exposure/road caches off the interaction path
    return () => { active = false; };
  }, []);

  // one shared map instance across routes (docs/avert-refactor/04_ARCHITECTURE_AND_STATE.md
  // "reuse a map instance where practical") — pages only toggle the chrome around it.
  return (
    <div className="h-full flex flex-col bg-canvas text-ink">
      <AppHeader />
      {!chromelessRoute && <ContextBar />}
      {onEvidence ? (
        <EvidencePage />
      ) : onAlertsHome ? (
        <AlertsHomePage />
      ) : onAlertsComposer ? (
        <AlertComposerPage />
      ) : onAlertsRun ? (
        <SimulationResultsPage />
      ) : onAccount ? (
        <AccountPage />
      ) : onPreferences ? (
        <PreferencesPage />
      ) : (
        <div className="flex-1 flex min-h-0">
          {onCommunities && <CommunitiesList />}
          <main className="relative flex-1 min-w-0">
            <MapView />
            {!onCommunities && <EventSummaryOverlay />}
            <LayersControl />
            {!onCommunities && <MapControls />}
            {!onCommunities && <TimelinePlayer />}
            {onCommunities && <CommunitiesMapControls />}
            <SourceConfidence />
            <ModelPanel />
            <HistoryPanel />
            <DemoMode />
            {/* sits above MapLibre's scale control (bottom-left) so the two never overlap */}
            <div className="on-map-text pointer-events-none absolute bottom-8 left-3 z-10 max-w-[240px] text-[9px] leading-relaxed text-white/50">
              Demonstration &amp; modeled data · estimates require ground verification
            </div>
            {!weatherReady && (
              <div className="glass-panel absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 px-2.5 py-1.5 text-[10px] text-muted">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-action" /> Loading live rainfall
              </div>
            )}
          </main>
          {!onCommunities && (askAvertOpen ? <AskAvertPanel /> : selectedId ? <CommunityInspector /> : null)}
        </div>
      )}
    </div>
  );
}
