import { useMemo, useState } from "react";
import distance from "@turf/distance";
import { MapPin, Navigation, ChevronLeft, MessageSquare, ShieldAlert } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { ALL_COMMUNITIES, getRegion } from "../data/regions";
import { eventsInRegion, getEvent } from "../data/flood";
import { computeStep } from "../services/exposure";
import { susceptibilityFor } from "../data/features";
import { photoFor } from "../data/photos";
import { PRIORITY_COLOR, SUSC_COLOR, type Community } from "../models/contracts";

const COVERAGE_KM = 120; // supported-area radius for "outside coverage" honesty

function nearestSupported(lat: number, lng: number): { community: Community; km: number } | null {
  let best: { community: Community; km: number } | null = null;
  for (const c of ALL_COMMUNITIES) {
    const km = distance([lng, lat], [c.lng, c.lat], { units: "kilometers" });
    if (!best || km < best.km) best = { community: c, km };
  }
  return best && best.km <= COVERAGE_KM ? best : null;
}

export default function CompactPreviewPage() {
  const [selected, setSelected] = useState<Community | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied" | "outside">("idle");
  const [showSms, setShowSms] = useState(false);

  const useLocation = () => {
    if (!navigator.geolocation) { setGeoState("denied"); return; }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const match = nearestSupported(pos.coords.latitude, pos.coords.longitude);
        if (match) { setSelected(match.community); setGeoState("idle"); } else setGeoState("outside");
      },
      () => setGeoState("denied"),
      { timeout: 8000 },
    );
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <BrandMark compact />
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-priority/15 text-priority uppercase tracking-wide">Demo preview</span>
      </header>

      {!selected ? (
        <div className="flex-1 p-4 max-w-md mx-auto w-full">
          <h1 className="text-xl font-semibold mt-2">Check flood risk</h1>
          <p className="text-sm text-muted mt-1">Select a supported community, or use your location.</p>

          <button onClick={useLocation} disabled={geoState === "locating"} className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-action text-white text-sm font-medium disabled:opacity-60">
            <Navigation size={15} /> {geoState === "locating" ? "Locating…" : "Use my location"}
          </button>
          {geoState === "denied" && <p className="text-xs text-danger mt-2">Location access was denied or unavailable. Choose a community below instead.</p>}
          {geoState === "outside" && <p className="text-xs text-priority mt-2">No assessment available — your location is outside supported coverage.</p>}

          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-wide text-faint mb-1.5">Or choose manually</div>
            <CommunityPicker onSelect={setSelected} />
          </div>
        </div>
      ) : (
        <AssessmentView community={selected} onBack={() => setSelected(null)} showSms={showSms} setShowSms={setShowSms} />
      )}
    </div>
  );
}

function CommunityPicker({ onSelect }: { onSelect: (c: Community) => void }) {
  const [q, setQ] = useState("");
  const filtered = ALL_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search community…" className="w-full h-10 px-3 rounded-lg bg-field border border-border text-sm text-ink placeholder:text-faint outline-none focus:border-action/50" />
      <div className="mt-2 max-h-[50vh] overflow-y-auto divide-y divide-border rounded-lg border border-border">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => onSelect(c)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-hover">
            <MapPin size={13} className="text-action shrink-0" />
            <span className="text-sm text-ink">{c.name}</span>
            <span className="text-[10px] text-faint ml-auto">{c.admin1}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="px-3 py-6 text-center text-xs text-faint">No match.</div>}
      </div>
    </div>
  );
}

function AssessmentView({ community, onBack, showSms, setShowSms }: { community: Community; onBack: () => void; showSms: boolean; setShowSms: (v: boolean) => void }) {
  const region = getRegion(community.countryIso3 === "GHA" ? (community.id.startsWith("WV") ? "whiteVolta" : "lowerVolta") : (community.id.startsWith("FN") ? "farNorth" : "douala"));
  const events = eventsInRegion(region.id);
  const eventId = events[events.length - 1]?.id;
  const event = eventId ? getEvent(eventId) : null;
  const stepIndex = event ? event.steps.length - 1 : 0;

  const { snap, prio } = useMemo(() => {
    if (!eventId) return { snap: undefined, prio: undefined };
    const { snapshots, priorities } = computeStep(eventId, stepIndex);
    return { snap: snapshots.get(community.id), prio: priorities.find((p) => p.communityId === community.id) };
  }, [eventId, stepIndex, community.id]);

  const susc = susceptibilityFor(community.id);
  const photo = photoFor(community.name, region.id, !!snap && snap.floodStatus !== "safe");
  const col = prio ? PRIORITY_COLOR[prio.level] : susc ? SUSC_COLOR[susc.class] : "#8ea5b7";

  return (
    <div className="flex-1 p-4 max-w-md mx-auto w-full">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-faint hover:text-ink"><ChevronLeft size={12} /> Choose another community</button>

      <h1 className="text-xl font-semibold mt-2">{community.name}</h1>
      <div className="text-xs text-muted">{community.admin2 !== "—" ? `${community.admin2}, ` : ""}{community.admin1} · {region.name}</div>

      {photo && <img src={photo.url} alt="" className="mt-3 w-full h-40 object-cover rounded-xl border border-border" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}

      {snap && prio ? (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase" style={{ background: `${col}1f`, color: col }}>{prio.level}</span>
            <span className="text-[10px] text-faint">as of {event?.steps[stepIndex].day}</span>
          </div>
          <div className="text-3xl font-semibold mono mt-2" style={{ color: col }}>{prio.score}<span className="text-sm text-faint">/100</span></div>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            {snap.floodStatus === "safe"
              ? `${community.name} is outside the modeled flood extent for the most recent supported event. Monitoring only.`
              : `${community.name} intersects the modeled flood extent from the most recent supported event, with estimated ${snap.depthBand?.value ?? "shallow"} depth. Response priority ${prio.score}/100. Estimates require ground verification.`}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-faint">No assessment available for this community yet.</div>
      )}

      {susc && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-faint mb-1">Baseline susceptibility</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium capitalize" style={{ color: SUSC_COLOR[susc.class] }}>{susc.class.replace("-", " ")}</span>
            <span className="mono text-sm" style={{ color: SUSC_COLOR[susc.class] }}>{susc.index}/100</span>
          </div>
        </div>
      )}

      <button onClick={() => setShowSms(!showSms)} className="mt-4 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-field border border-border text-sm text-ink hover:bg-hover">
        <MessageSquare size={14} /> {showSms ? "Hide" : "Show"} simulated SMS preview
      </button>
      {showSms && (
        <div className="mt-3 rounded-xl border border-border bg-[#0b0f14] p-3 text-[11px] text-white leading-relaxed">
          <div className="flex items-center gap-1.5 text-priority font-semibold mb-1"><ShieldAlert size={12} /> AVERT DEMO</div>
          Flood-risk exercise for {community.name}. Follow local authority updates and avoid flooded roads. This is a simulation, not a real warning.
        </div>
      )}

      <p className="text-[10px] text-faint mt-4 leading-relaxed">Illustrative demo preview. Does not subscribe this device or send a message. Verify locally before acting on any information here.</p>
    </div>
  );
}
