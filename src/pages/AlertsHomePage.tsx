import { useState } from "react";
import { Plus, Copy, Trash2, ArrowRight, MessageSquareWarning } from "lucide-react";
import { useAlertsStore } from "../stores/alertsStore";
import { useStore } from "../store";
import { reconcile } from "../domain/alertTypes";
import { navigate } from "../platform/router";

export default function AlertsHomePage() {
  const { drafts, runs, deleteDraft, duplicateDraft } = useAlertsStore();
  const selectedId = useStore((s) => s.selectedId);
  const [tab, setTab] = useState<"drafts" | "runs">(drafts.length === 0 && runs.length > 0 ? "runs" : "drafts");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const newSimulation = () => navigate(selectedId ? "/app/alerts/new" : "/app/communities");

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-start justify-between max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Alerts</h1>
          <p className="text-sm text-muted mt-0.5">Resume drafts and inspect prior simulation runs.</p>
        </div>
        <button onClick={newSimulation} className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90"><Plus size={15} /> New simulation</button>
      </div>

      <div className="max-w-4xl mx-auto flex items-center gap-4 mt-5 border-b border-border">
        <TabBtn active={tab === "drafts"} onClick={() => setTab("drafts")}>Drafts ({drafts.length})</TabBtn>
        <TabBtn active={tab === "runs"} onClick={() => setTab("runs")}>Simulations ({runs.length})</TabBtn>
      </div>

      <div className="max-w-4xl mx-auto mt-4">
        {tab === "drafts" && (
          drafts.length === 0 ? (
            <EmptyState text="No drafts yet. Select a community on Monitor or Communities, then start a new simulation to prepare a message." />
          ) : (
            <div className="space-y-2">
              {[...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{d.communityName} · {d.regionName}</div>
                    <div className="text-[11px] text-faint mt-0.5">Updated {new Date(d.updatedAt).toLocaleString()} · {d.reviewed ? "Reviewed" : "Not reviewed"} · {d.language.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => navigate(`/app/alerts/${d.id}`)} className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-field hover:bg-hover border border-border text-xs text-ink">Open <ArrowRight size={12} /></button>
                    <button onClick={() => duplicateDraft(d.id)} title="Duplicate draft" className="h-8 w-8 flex items-center justify-center rounded-lg bg-field hover:bg-hover border border-border text-muted"><Copy size={13} /></button>
                    {confirmDelete === d.id ? (
                      <button onClick={() => { deleteDraft(d.id); setConfirmDelete(null); }} className="h-8 px-2.5 rounded-lg bg-danger/20 border border-danger/30 text-danger text-xs font-medium">Confirm delete</button>
                    ) : (
                      <button onClick={() => setConfirmDelete(d.id)} title="Delete draft" className="h-8 w-8 flex items-center justify-center rounded-lg bg-field hover:bg-hover border border-border text-muted"><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "runs" && (
          runs.length === 0 ? (
            <EmptyState text="No simulation runs yet." />
          ) : (
            <div className="space-y-2">
              {[...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map((r) => {
                const counts = reconcile(r);
                return (
                  <button key={r.id} onClick={() => navigate(`/app/alerts/run/${r.id}`)} className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 text-left hover:border-action/40">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{r.communityName} exercise</div>
                      <div className="text-[11px] text-faint mt-0.5">{new Date(r.startedAt).toLocaleString()} · {r.status} · {counts.delivered} delivered, {counts.failed} failed</div>
                    </div>
                    <MessageSquareWarning size={16} className={counts.failed > 0 ? "text-priority" : "text-faint"} />
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`relative pb-2.5 text-sm font-medium ${active ? "text-ink" : "text-faint hover:text-muted"}`}>
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-action rounded-full" />}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-faint">{text}</div>;
}
