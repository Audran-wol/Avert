import { Waves, Mountain, Flame, ArrowRight, Lock } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../auth/AuthContext";
import { navigate } from "../platform/router";
import { ALL_COMMUNITIES } from "../data/regions";

interface Hazard {
  id: string;
  icon: typeof Waves;
  name: string;
  tagline: string;
  detail: string;
  status: "active" | "soon";
  stats?: string[];
  eta?: string;
}

const HAZARDS: Hazard[] = [
  {
    id: "flood", icon: Waves, name: "Floods", status: "active",
    tagline: "Live module",
    detail: "Historical reconstruction and forward risk for riverine, dam-release and urban-pluvial flooding across supported basins.",
    stats: [`${ALL_COMMUNITIES.length} communities`, "Ghana · Cameroon", "SRTM + OSM + GDACS"],
  },
  {
    id: "landslide", icon: Mountain, name: "Landslides", status: "soon",
    tagline: "In development",
    detail: "Slope, soil saturation and rainfall-trigger modelling for the highland corridors already covered by our terrain pipeline.",
    eta: "Terrain layer in place — susceptibility model pending",
  },
  {
    id: "drought", icon: Flame, name: "Drought & heat stress", status: "soon",
    tagline: "Planned",
    detail: "Slow-onset water stress and agricultural exposure, built on the same evidence and alerting backbone.",
    eta: "Scoping — shares the rainfall and exposure services",
  },
];

export default function HazardSelectPage() {
  const { session } = useAuth();
  const firstName = (session?.user.name ?? "Operator").split(" ")[0];

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <header className="flex h-[60px] items-center justify-between border-b border-[var(--color-border)] px-5">
        <BrandMark compact />
        <span className="text-[11px] text-faint">{session?.user.email ?? "Demo workspace"}</span>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-action">Select a hazard module</p>
        <h1 className="mt-2.5 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink">Welcome back, {firstName}.</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
          Avert is one operational picture per hazard. Floods are live today; the rest of the roadmap
          runs on the same terrain, evidence and alerting backbone.
        </p>

        <div className="mt-9 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
          {HAZARDS.map((h) => <HazardCard key={h.id} hazard={h} />)}
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-faint">
          Modules marked “coming soon” are not implemented in this build and are shown to describe the
          product roadmap, not existing capability.
        </p>
      </main>
    </div>
  );
}

function HazardCard({ hazard }: { hazard: Hazard }) {
  const active = hazard.status === "active";
  const Icon = hazard.icon;

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-action/15 text-action" : "bg-raised text-faint"}`}>
          <Icon size={20} />
        </span>
        {active ? (
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> {hazard.tagline}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
            <Lock size={9} /> Coming soon
          </span>
        )}
      </div>

      <h2 className={`mt-4 text-[19px] font-semibold ${active ? "text-ink" : "text-muted"}`}>{hazard.name}</h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{hazard.detail}</p>

      {hazard.stats && (
        <ul className="mt-4 space-y-1.5">
          {hazard.stats.map((s) => (
            <li key={s} className="flex items-center gap-2 text-[11.5px] text-faint">
              <span className="h-1 w-1 rounded-full bg-action" /> {s}
            </li>
          ))}
        </ul>
      )}
      {hazard.eta && <p className="mt-4 text-[11px] italic text-faint">{hazard.eta}</p>}

      {active && (
        <span className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-action">
          Open workspace <ArrowRight size={15} />
        </span>
      )}
    </>
  );

  if (!active) {
    return (
      <div aria-disabled="true" className="panel-surface cursor-not-allowed p-5 opacity-60">{body}</div>
    );
  }
  return (
    <button onClick={() => navigate("/app")} className="panel-surface p-5 text-left transition-all hover:border-action/40 hover:shadow-[0_0_0_1px_var(--color-action),0_18px_40px_-20px_rgba(59,135,240,.5)]">
      {body}
    </button>
  );
}
