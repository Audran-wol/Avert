import { useMemo, useState } from "react";
import { Play, Download, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Square, Search } from "lucide-react";
import { useAlertsStore } from "../stores/alertsStore";
import { reconcile, recipientOutcomes } from "../domain/alertTypes";
import { navigate, usePathname } from "../platform/router";
import NotificationsPanel from "../components/NotificationsPanel";

const PAGE_SIZE = 10;

export default function SimulationResultsPage() {
  const path = usePathname();
  const runId = path.split("/").pop();
  const { runs, cancelRun, retryRun } = useAlertsStore();
  const run = runs.find((r) => r.id === runId);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const counts = useMemo(() => (run ? reconcile(run) : null), [run]);
  const outcomes = useMemo(() => (run ? recipientOutcomes(run) : null), [run]);

  if (!run || !counts || !outcomes) {
    return <div className="flex-1 flex items-center justify-center text-sm text-faint">Run not found. <button onClick={() => navigate("/app/alerts")} className="text-action hover:underline ml-1">Back to alerts</button></div>;
  }

  const rows = run.recipientIds
    .filter((id) => (q.trim() ? id.toLowerCase().includes(q.trim().toLowerCase()) : true))
    .map((id) => ({ id, attempt: outcomes.get(id) }));
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const total = run.recipientIds.length;
  const deliveredPct = total ? Math.round((counts.delivered / total) * 100) : 0;
  const failedPct = total ? Math.round((counts.failed / total) * 100) : 0;

  const exportReport = () => {
    const header = ["Recipient", "Channel", "Result", "Detail", "Attempt"];
    const body = rows.map((r) => [r.id, run.language === "fr" ? "SMS" : "SMS", resultLabel(r.attempt?.status ?? "queued"), r.attempt?.reason ?? "—", String(r.attempt?.number ?? 1)]);
    const csv = [header, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `avert-exercise-${run.id.slice(0, 8)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl">
          <button onClick={() => navigate("/app/alerts")} className="flex items-center gap-1 text-xs text-faint hover:text-ink mb-2"><ChevronLeft size={12} /> Alerts</button>
          <h1 className="text-2xl font-semibold text-ink">Simulation results</h1>
          <p className="text-sm text-muted mt-0.5">{run.communityName} · SMS exercise · {run.scenarioLabel}</p>
          <div className="mt-3 px-3 py-2 rounded-lg bg-priority/10 border border-priority/25 text-xs text-priority font-medium">Demo run — no real messages sent.</div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat value={total} label="Demo recipients" />
            <Stat value={counts.delivered} label="Simulated delivered" icon={CheckCircle2} color="text-success" />
            <Stat value={counts.failed} label="Simulated failed" icon={AlertTriangle} color="text-priority" />
          </div>

          <div className="mt-3 h-2 rounded-full bg-field overflow-hidden flex">
            <div className="h-full bg-success" style={{ width: `${deliveredPct}%` }} />
            <div className="h-full bg-priority" style={{ width: `${failedPct}%` }} />
          </div>
          <div className="text-[11px] text-faint mt-1">{deliveredPct}% simulated delivery{run.status === "running" ? " · running…" : ""}</div>

          <div className="flex items-center justify-between mt-6">
            <h2 className="text-sm font-semibold text-ink">Recipient outcomes</h2>
            <div className="flex items-center gap-2 bg-field border border-border rounded-lg px-2.5 h-8">
              <Search size={12} className="text-faint" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Find demo recipient…" className="bg-transparent outline-none text-xs text-ink placeholder:text-faint w-40" />
            </div>
          </div>

          <table className="w-full text-xs mt-2">
            <thead><tr className="text-[10px] uppercase tracking-wide text-faint border-b border-border"><th className="text-left px-2 py-1.5">Recipient</th><th className="text-left px-2 py-1.5">Channel</th><th className="text-left px-2 py-1.5">Result</th><th className="text-left px-2 py-1.5">Detail</th></tr></thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-2 py-2 text-ink">{r.id}</td>
                  <td className="px-2 py-2 text-muted">SMS</td>
                  <td className="px-2 py-2"><ResultBadge status={r.attempt?.status ?? "queued"} /></td>
                  <td className="px-2 py-2 text-muted">{detailFor(r.attempt?.status, r.attempt?.reason)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-2 text-[11px] text-faint">
            <span>Showing {pageRows.length} of {rows.length} demo recipients</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-6 h-6 rounded flex items-center justify-center bg-field border border-border disabled:opacity-40"><ChevronLeft size={12} /></button>
              <span className="mono px-1">{page + 1}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-6 h-6 rounded flex items-center justify-center bg-field border border-border disabled:opacity-40"><ChevronRight size={12} /></button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5">
            {run.status === "running" ? (
              <button onClick={() => cancelRun(run.id)} className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover"><Square size={13} /> Cancel run</button>
            ) : counts.failed > 0 ? (
              <button onClick={() => retryRun(run.id)} className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90"><Play size={14} /> Simulate retry for {counts.failed}</button>
            ) : null}
            <button onClick={exportReport} className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover"><Download size={14} /> Export exercise report</button>
            <button onClick={() => navigate("/app/alerts")} className="text-xs text-faint hover:text-ink ml-auto">Back to alerts</button>
          </div>
        </div>
      </div>
      <NotificationsPanel runIdFilter={run.id} />
    </div>
  );
}

function Stat({ value, label, icon: Icon, color }: { value: number; label: string; icon?: typeof CheckCircle2; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className={`text-2xl font-semibold mono ${color ?? "text-ink"} flex items-center gap-1.5`}>{Icon && <Icon size={16} />}{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-faint mt-1">{label}</div>
    </div>
  );
}

function ResultBadge({ status }: { status: string }) {
  if (status === "simulated-delivered") return <span className="flex items-center gap-1 text-success"><CheckCircle2 size={12} /> Simulated delivered</span>;
  if (status === "simulated-failed") return <span className="flex items-center gap-1 text-priority"><AlertTriangle size={12} /> Simulated failed</span>;
  if (status === "cancelled") return <span className="text-faint">Cancelled</span>;
  if (status === "processing") return <span className="text-action">Processing…</span>;
  return <span className="text-faint">Queued</span>;
}

function resultLabel(status: string) {
  return status === "simulated-delivered" ? "Simulated delivered" : status === "simulated-failed" ? "Simulated failed" : status === "cancelled" ? "Cancelled" : status === "processing" ? "Processing" : "Queued";
}
function detailFor(status?: string, reason?: string) {
  if (status === "simulated-delivered") return "Demo gateway accepted";
  if (status === "simulated-failed") return reason === "demo-invalid-recipient" ? "Simulated invalid number" : "Simulated timeout";
  if (status === "cancelled") return "Cancelled before delivery";
  return "—";
}
