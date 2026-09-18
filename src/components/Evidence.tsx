import type { EvidenceRef, EvidenceState } from "../models/contracts";

const STATE_COLOR: Record<EvidenceState, string> = {
  OBSERVED: "#31C48D",
  FORECAST: "#42C8E8",
  INFERRED: "#E3B341",
  ASSESSED: "#F28A35",
  REPORTED: "#9AA7B3",
  UNVERIFIED: "#667482",
};

// Provenance chip — every displayed fact carries one (Transition doctrine §3.2).
export function Evidence({ ev, showSource = false }: { ev: EvidenceRef; showSource?: boolean }) {
  const c = STATE_COLOR[ev.evidenceState];
  const when = ev.observedAt ?? ev.issuedAt ?? ev.validFrom;
  const title = [ev.sourceName ?? ev.sourceId, when, ev.confidence != null ? `conf ${Math.round(ev.confidence * 100)}%` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 text-[9px] font-semibold px-1 py-[1px] rounded cursor-help align-middle"
      style={{ background: `${c}26`, color: c }}
    >
      {ev.evidenceState}
      {showSource && ev.sourceName && <span className="opacity-70 font-normal">· {ev.sourceName}</span>}
    </span>
  );
}
